import crypto from 'node:crypto';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import { DEV_DB_EXIT_CODES } from '../exit-codes';
import { runHealthGates } from '../health';
import { BackendUnavailableError, DevDbError } from '../errors';
import type { DevDbBackend, UpContext } from '../backend';
import type { DevDbState } from '../state-store';

const execFile = promisify(execFileCb);

const MONGO_IMAGE = process.env.DEV_DB_DOCKER_IMAGE || 'mongo:8.2.7';
const OWNER_LABEL_KEY = 'com.rocketchat.dev-db.owner';
const MANAGED_LABEL_KEY = 'com.rocketchat.dev-db.managed';

const getOwnershipMarker = (): string => {
	const source = `${process.cwd()}:${process.env.USER || 'unknown-user'}`;
	return crypto.createHash('sha1').update(source).digest('hex').slice(0, 12);
};

const runDocker = async (args: string[]): Promise<string> => {
	try {
		const result = await execFile('docker', args, { maxBuffer: 1024 * 1024 });
		return result.stdout.trim();
	} catch (error) {
		const message = (error as Error).message || 'docker command failed';
		throw new BackendUnavailableError('Docker command failed. Ensure Docker is installed and daemon is running.', {
			args,
			message,
		});
	}
};

const ensureDockerAvailable = async (): Promise<void> => {
	await runDocker(['version', '--format', '{{.Server.Version}}']);
	await runDocker(['info', '--format', '{{.ServerErrors}}']);
};

const getContainerName = (ownershipMarker: string, port: number): string => `rc-dev-db-${ownershipMarker}-${port}`;
const getVolumeName = (ownershipMarker: string): string => `rc-dev-db-data-${ownershipMarker}`;

const ensureVolume = async (volumeName: string): Promise<void> => {
	await runDocker(['volume', 'create', volumeName]);
};

const containerExists = async (containerName: string): Promise<boolean> => {
	const output = await runDocker(['ps', '-a', '--filter', `name=^/${containerName}$`, '--format', '{{.ID}}']);
	return output.length > 0;
};

const isContainerRunning = async (containerName: string): Promise<boolean> => {
	const output = await runDocker(['inspect', '-f', '{{.State.Running}}', containerName]);
	return output.trim() === 'true';
};

const ensureContainerRunning = async (params: {
	containerName: string;
	volumeName: string;
	ownershipMarker: string;
	port: number;
	replicaSetEnabled: boolean;
	replicaSetName: string;
}): Promise<string> => {
	const { containerName, volumeName, ownershipMarker, port, replicaSetEnabled, replicaSetName } = params;

	if (await containerExists(containerName)) {
		if (!(await isContainerRunning(containerName))) {
			await runDocker(['start', containerName]);
		}
		return runDocker(['inspect', '-f', '{{.Id}}', containerName]);
	}

	const runArgs = [
		'run',
		'-d',
		'--name',
		containerName,
		'--label',
		`${MANAGED_LABEL_KEY}=true`,
		'--label',
		`${OWNER_LABEL_KEY}=${ownershipMarker}`,
		'-p',
		`127.0.0.1:${port}:27017`,
		'-v',
		`${volumeName}:/data/db`,
		MONGO_IMAGE,
		'mongod',
		'--bind_ip_all',
		'--port',
		'27017',
	];

	if (replicaSetEnabled) {
		runArgs.push('--replSet', replicaSetName);
	}

	return runDocker(runArgs);
};

const waitForMongod = async (containerName: string): Promise<void> => {
	const maxAttempts = 20;
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			await runDocker(['exec', containerName, 'mongosh', '--quiet', '--eval', 'db.adminCommand({ ping: 1 }).ok']);
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	throw new DevDbError('Mongo container did not become ready in time.', DEV_DB_EXIT_CODES.HEALTH_PING_FAILED, {
		containerName,
	});
};

const ensureReplicaSetInitialized = async (containerName: string, replicaSetName: string): Promise<void> => {
	const script = `
		const rsName = '${replicaSetName}';
		const cfg = { _id: rsName, members: [{ _id: 0, host: '127.0.0.1:27017' }] };
		let initialized = false;
		try {
			const status = rs.status();
			initialized = Boolean(status && status.ok === 1);
		} catch (_error) {
			initialized = false;
		}
		if (!initialized) {
			rs.initiate(cfg);
		}
	`;

	await runDocker(['exec', containerName, 'mongosh', '--quiet', '--eval', script]);
};

const getOwnedLabel = async (containerName: string): Promise<string> => {
	return runDocker(['inspect', '-f', `{{ index .Config.Labels \"${OWNER_LABEL_KEY}\" }}`, containerName]);
};

const removeOwnedContainer = async (state: DevDbState): Promise<void> => {
	if (!state.containerId || !state.ownershipMarker) {
		return;
	}

	const containerName = getContainerName(state.ownershipMarker, state.port);
	if (!(await containerExists(containerName))) {
		return;
	}

	const ownedBy = await getOwnedLabel(containerName);
	if (ownedBy !== state.ownershipMarker) {
		return;
	}

	await runDocker(['rm', '-f', containerName]);
};

const removeOwnedVolume = async (state: DevDbState): Promise<void> => {
	if (!state.volumeName || !state.ownershipMarker) {
		return;
	}

	const containerName = getContainerName(state.ownershipMarker, state.port);
	if (await containerExists(containerName)) {
		const ownedBy = await getOwnedLabel(containerName);
		if (ownedBy === state.ownershipMarker) {
			await runDocker(['rm', '-f', containerName]);
		}
	}

	await runDocker(['volume', 'rm', state.volumeName]);
};

const toMongoUrl = (port: number, replicaSetEnabled: boolean, replicaSetName: string): string => {
	const base = `mongodb://127.0.0.1:${port}/meteor`;
	if (!replicaSetEnabled) {
		return base;
	}

	return `${base}?replicaSet=${replicaSetName}`;
};

const toOplogUrl = (port: number, replicaSetEnabled: boolean, replicaSetName: string): string | undefined => {
	if (!replicaSetEnabled) {
		return undefined;
	}

	return `mongodb://127.0.0.1:${port}/local?replicaSet=${replicaSetName}`;
};

export const dockerBackend: DevDbBackend = {
	kind: 'docker',
	up: async (context: UpContext) => {
		await ensureDockerAvailable();

		const ownershipMarker = getOwnershipMarker();
		const volumeName = getVolumeName(ownershipMarker);
		const containerName = getContainerName(ownershipMarker, context.port);

		await ensureVolume(volumeName);
		const containerId = await ensureContainerRunning({
			containerName,
			volumeName,
			ownershipMarker,
			port: context.port,
			replicaSetEnabled: context.replicaSetEnabled,
			replicaSetName: context.replicaSetName,
		});

		await waitForMongod(containerName);
		if (context.replicaSetEnabled) {
			await ensureReplicaSetInitialized(containerName, context.replicaSetName);
		}

		const mongoUrl = toMongoUrl(context.port, context.replicaSetEnabled, context.replicaSetName);
		const mongoOplogUrl = toOplogUrl(context.port, context.replicaSetEnabled, context.replicaSetName);

		await runHealthGates(mongoUrl, context.replicaSetEnabled);

		const now = new Date().toISOString();
		return {
			state: {
				version: 1,
				owner: {
					pid: process.pid,
					hostname: process.env.HOSTNAME || 'localhost',
					command: process.argv.join(' '),
				},
				backend: 'docker',
				port: context.port,
				replicaSetName: context.replicaSetEnabled ? context.replicaSetName : undefined,
				containerId: containerId.trim(),
				volumeName,
				ownershipMarker,
				startedAt: now,
				updatedAt: now,
			},
			mongoUrl,
			mongoOplogUrl,
		};
	},
	down: async (state: DevDbState | undefined) => {
		if (!state || state.backend !== 'docker') {
			return;
		}

		await ensureDockerAvailable();
		await removeOwnedContainer(state);
	},
	logs: async (state: DevDbState | undefined) => {
		if (!state || state.backend !== 'docker' || !state.ownershipMarker) {
			return 'Docker backend has no active state.';
		}

		await ensureDockerAvailable();
		const containerName = getContainerName(state.ownershipMarker, state.port);
		if (!(await containerExists(containerName))) {
			return 'Docker container not found.';
		}

		return runDocker(['logs', '--tail', '200', containerName]);
	},
	reset: async (state: DevDbState | undefined) => {
		if (!state || state.backend !== 'docker') {
			return;
		}

		await ensureDockerAvailable();
		await removeOwnedVolume(state);
	},
};
