import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn, execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import { DEV_DB_EXIT_CODES } from '../exit-codes';
import { assertAdminPing, assertTcpReachable, runHealthGates } from '../health';
import { BackendUnavailableError, DevDbError } from '../errors';
import type { DevDbBackend, UpContext } from '../backend';
import type { DevDbState } from '../state-store';
import { resolveBinaryTarget } from './binary-manifest';
import { ensureReplicaSetInitialized } from './replica-set';

const execFile = promisify(execFileCb);

const sleep = async (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isAlive = (pid: number): boolean => {
	if (!pid || pid <= 0) {
		return false;
	}

	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
};

const lookupPathBinary = async (name: string): Promise<string | undefined> => {
	try {
		const result = await execFile('which', [name]);
		const resolved = result.stdout.trim();
		return resolved.length > 0 ? resolved : undefined;
	} catch {
		return undefined;
	}
};

const computeSha256 = async (filePath: string): Promise<string> => {
	const content = await fs.readFile(filePath);
	return crypto.createHash('sha256').update(content).digest('hex');
};

const parseExpectedSha = (raw: string): string => {
	const match = raw.match(/[a-fA-F0-9]{64}/);
	if (!match) {
		throw new Error('Could not parse sha256 from checksum payload.');
	}

	return match[0].toLowerCase();
};

const downloadFile = async (url: string, destination: string): Promise<void> => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Download failed (${response.status}) for ${url}`);
	}

	const bytes = Buffer.from(await response.arrayBuffer());
	await fs.writeFile(destination, bytes);
};

const fetchText = async (url: string): Promise<string> => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Checksum download failed (${response.status}) for ${url}`);
	}

	return response.text();
};

const extractArchive = async (archivePath: string, extractDir: string): Promise<void> => {
	await fs.mkdir(extractDir, { recursive: true });

	try {
		await execFile('tar', ['-xzf', archivePath, '-C', extractDir]);
	} catch (error) {
		throw new Error(`Could not extract archive with tar: ${(error as Error).message}`);
	}
};

const findExtractedMongoDir = async (extractDir: string): Promise<string> => {
	const entries = await fs.readdir(extractDir, { withFileTypes: true });
	const directory = entries.find((entry) => entry.isDirectory() && entry.name.startsWith('mongodb-'));

	if (!directory) {
		throw new Error('Could not find extracted MongoDB directory.');
	}

	return path.join(extractDir, directory.name);
};

const stopProcess = async (pid: number): Promise<void> => {
	if (!isAlive(pid)) {
		return;
	}

	process.kill(pid, 'SIGINT');
	for (let attempt = 0; attempt < 20; attempt += 1) {
		if (!isAlive(pid)) {
			return;
		}
		await sleep(250);
	}

	if (isAlive(pid)) {
		process.kill(pid, 'SIGKILL');
	}
};

const resolveManagedBinary = async (context: UpContext): Promise<{ binaryPath: string; version: string }> => {
	const envBinary = process.env.DEV_DB_BINARY_PATH;
	if (envBinary) {
		return { binaryPath: envBinary, version: 'env-override' };
	}

	const pathBinary = await lookupPathBinary('mongod');
	if (pathBinary) {
		return { binaryPath: pathBinary, version: 'system-path' };
	}

	const { version, target } = resolveBinaryTarget();
	if (!target) {
		throw new BackendUnavailableError(
			'No binary target available for this platform/arch and mongod is not available in PATH.',
			{ platform: process.platform, arch: process.arch },
		);
	}

	const cacheRoot = path.join(context.paths.rootDir, 'binary-cache', version, `${target.platform}-${target.arch}`);
	const archivePath = path.join(cacheRoot, target.archiveName);
	const extractDir = path.join(cacheRoot, 'extract');
	const markerPath = path.join(cacheRoot, 'integrity.json');

	await fs.mkdir(cacheRoot, { recursive: true });

	try {
		const markerRaw = await fs.readFile(markerPath, 'utf8');
		const marker = JSON.parse(markerRaw) as { binaryPath: string };
		await fs.access(marker.binaryPath);
		return { binaryPath: marker.binaryPath, version };
	} catch {
		// Cache miss or stale cache.
	}

	await downloadFile(target.downloadUrl, archivePath);
	const expectedSha = parseExpectedSha(await fetchText(target.checksumUrl));
	const actualSha = await computeSha256(archivePath);

	if (expectedSha !== actualSha) {
		throw new DevDbError('Downloaded MongoDB archive checksum mismatch.', DEV_DB_EXIT_CODES.BACKEND_NOT_AVAILABLE, {
			expectedSha,
			actualSha,
			archivePath,
		});
	}

	await extractArchive(archivePath, extractDir);
	const extractedRoot = await findExtractedMongoDir(extractDir);
	const binaryPath = path.join(extractedRoot, 'bin', 'mongod');
	await fs.chmod(binaryPath, 0o755);

	await fs.writeFile(
		markerPath,
		`${JSON.stringify({ version, binaryPath, archivePath, expectedSha, target }, null, 2)}\n`,
		'utf8',
	);

	return { binaryPath, version };
};

const spawnManagedMongod = async (params: {
	binaryPath: string;
	port: number;
	dbPath: string;
	logPath: string;
	replicaSetEnabled: boolean;
	replicaSetName: string;
}): Promise<number> => {
	const { binaryPath, port, dbPath, logPath, replicaSetEnabled, replicaSetName } = params;

	await fs.mkdir(dbPath, { recursive: true });
	await fs.rm(path.join(dbPath, 'mongod.lock'), { force: true });
	await fs.mkdir(path.dirname(logPath), { recursive: true });

	const args = [
		'--dbpath',
		dbPath,
		'--bind_ip',
		'127.0.0.1',
		'--port',
		String(port),
		'--logpath',
		logPath,
		'--logappend',
	];

	if (replicaSetEnabled) {
		args.push('--replSet', replicaSetName);
	}

	const child = spawn(binaryPath, args, {
		detached: true,
		stdio: 'ignore',
		env: {
			...process.env,
			LANG: 'C',
			LC_ALL: 'C',
		},
	});

	child.unref();

	if (!child.pid) {
		throw new BackendUnavailableError('Could not start mongod process.');
	}

	return child.pid;
};

const waitForStartup = async (params: {
	port: number;
	replicaSetEnabled: boolean;
	replicaSetName: string;
}): Promise<void> => {
	const { port, replicaSetEnabled, replicaSetName } = params;
	const directUrl = `mongodb://127.0.0.1:${port}/admin?directConnection=true`;

	for (let attempt = 1; attempt <= 30; attempt += 1) {
		try {
			await assertTcpReachable(directUrl);
			await assertAdminPing(directUrl);
			if (replicaSetEnabled) {
				await ensureReplicaSetInitialized({ port, replicaSetName, maxAttempts: 5 });
			}
			return;
		} catch {
			await sleep(1000);
		}
	}

	throw new DevDbError('mongod did not become ready in time.', DEV_DB_EXIT_CODES.HEALTH_PING_FAILED);
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

export const binaryBackend: DevDbBackend = {
	kind: 'binary',
	up: async (context: UpContext) => {
		const dbPath = path.join(context.paths.rootDir, 'binary-data');
		const logPath = path.join(context.paths.rootDir, 'binary-mongod.log');
		const { binaryPath, version } = await resolveManagedBinary(context);

		let pid = 0;
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= 2; attempt += 1) {
			try {
				pid = await spawnManagedMongod({
					binaryPath,
					port: context.port,
					dbPath,
					logPath,
					replicaSetEnabled: context.replicaSetEnabled,
					replicaSetName: context.replicaSetName,
				});

				await waitForStartup({
					port: context.port,
					replicaSetEnabled: context.replicaSetEnabled,
					replicaSetName: context.replicaSetName,
				});

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
						backend: 'binary',
						port: context.port,
						replicaSetName: context.replicaSetEnabled ? context.replicaSetName : undefined,
						processId: pid,
						dbPath,
						logPath,
						binaryPath,
						ownershipMarker: `binary-${version}`,
						startedAt: now,
						updatedAt: now,
					},
					mongoUrl,
					mongoOplogUrl,
				};
			} catch (error) {
				lastError = error as Error;
				if (pid && isAlive(pid)) {
					await stopProcess(pid);
				}
			}
		}

		throw new BackendUnavailableError('Managed mongod failed to start after bounded retries.', {
			message: lastError?.message || 'unknown',
			binaryPath,
			logPath,
		});
	},
	down: async (state: DevDbState | undefined) => {
		if (!state || state.backend !== 'binary' || !state.processId) {
			return;
		}

		await stopProcess(state.processId);
	},
	logs: async (state: DevDbState | undefined) => {
		if (!state || state.backend !== 'binary') {
			return 'Binary backend has no active state.';
		}

		const logPath = state.logPath || path.join(process.env.DEV_DB_STATE_DIR || '', 'binary-mongod.log');
		try {
			const raw = await fs.readFile(logPath, 'utf8');
			const lines = raw.split('\n');
			return lines.slice(-200).join('\n');
		} catch {
			return 'Binary backend log file not found.';
		}
	},
	reset: async (state: DevDbState | undefined) => {
		if (!state || state.backend !== 'binary') {
			return;
		}

		if (state.processId && isAlive(state.processId)) {
			await stopProcess(state.processId);
		}

		if (state.dbPath) {
			await fs.rm(state.dbPath, { recursive: true, force: true });
		}
	},
};
