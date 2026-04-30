import { acquireLock, releaseLock } from './lock';
import { DEV_DB_EXIT_CODES } from './exit-codes';
import { DevDbError } from './errors';
import { externalBackend } from './backends/external';
import { dockerBackend } from './backends/docker';
import { binaryBackend } from './backends/binary';
import {
	resolveBackendSelection,
	resolveExternalMongoUrl,
	type DevDbBackend,
	type DevDbBackendRunMode,
	type DevDbBackendSelection,
} from './backend';
import {
	clearState,
	ensureStateDirectory,
	getDevDbPaths,
	loadState,
	saveState,
	type DevDbState,
} from './state-store';

export type LifecycleCommand = 'up' | 'down' | 'status' | 'url' | 'logs' | 'doctor' | 'reset';

export type LifecycleOptions = {
	outputMode?: 'text' | 'json';
	policy?: string;
	backend?: DevDbBackendRunMode;
	replicaSetEnabled?: boolean;
	replicaSetName?: string;
	port?: number;
	seedProfile?: 'minimal' | 'demo' | 'integration';
};

export type LifecycleResult = {
	exitCode: number;
	text: string;
	json?: Record<string, unknown>;
};

const DEFAULT_PORT = 27017;
const DEFAULT_REPLICA_SET_NAME = 'rs0';

const getBackendRegistry = (): Record<'docker' | 'binary' | 'external', DevDbBackend> => ({
	docker: dockerBackend,
	binary: binaryBackend,
	external: externalBackend,
});

const format = (result: LifecycleResult, mode: 'text' | 'json'): string => {
	if (mode === 'json') {
		return JSON.stringify(
			{
				exitCode: result.exitCode,
				message: result.text,
				...(result.json || {}),
			},
			null,
			2,
		);
	}

	return result.text;
};

const stateToJson = (state: DevDbState | undefined, selection?: DevDbBackendSelection): Record<string, unknown> => ({
	state: state || null,
	selection: selection || null,
});

const withLock = async (fn: () => Promise<LifecycleResult>): Promise<LifecycleResult> => {
	const paths = getDevDbPaths();
	await ensureStateDirectory(paths);
	await acquireLock(paths);
	try {
		return await fn();
	} finally {
		await releaseLock(paths);
	}
};

const up = async (options: LifecycleOptions): Promise<LifecycleResult> => {
	return withLock(async () => {
		const paths = getDevDbPaths();
		const selection = resolveBackendSelection({ policy: options.policy, runMode: options.backend });
		const backend = getBackendRegistry()[selection.selectedBackend];

		const existing = await loadState(paths);
		if (existing && existing.backend === selection.selectedBackend) {
			return {
				exitCode: DEV_DB_EXIT_CODES.OK,
				text: `dev-db is already up (${existing.backend})`,
				json: stateToJson(existing, selection),
			};
		}

		const replicaSetEnabled = options.replicaSetEnabled ?? true;
		const replicaSetName = options.replicaSetName || DEFAULT_REPLICA_SET_NAME;
		const port = options.port || DEFAULT_PORT;

		const result = await backend.up({
			paths,
			externalMongoUrl: resolveExternalMongoUrl(),
			replicaSetEnabled,
			replicaSetName,
			port,
		});

		await saveState(paths, result.state);

		return {
			exitCode: DEV_DB_EXIT_CODES.OK,
			text: `dev-db up (${result.state.backend}) ${result.mongoUrl}`,
			json: {
				selection,
				urls: {
					mongoUrl: result.mongoUrl,
					mongoOplogUrl: result.mongoOplogUrl,
				},
				state: result.state,
			},
		};
	});
};

const down = async (): Promise<LifecycleResult> => {
	return withLock(async () => {
		const paths = getDevDbPaths();
		const state = await loadState(paths);
		if (!state) {
			return {
				exitCode: DEV_DB_EXIT_CODES.OK,
				text: 'dev-db is already down',
				json: { state: null },
			};
		}

		const backend = getBackendRegistry()[state.backend];
		await backend.down(state);
		await clearState(paths);

		return {
			exitCode: DEV_DB_EXIT_CODES.OK,
			text: 'dev-db down completed',
			json: { state: null },
		};
	});
};

const status = async (options: LifecycleOptions): Promise<LifecycleResult> => {
	const paths = getDevDbPaths();
	await ensureStateDirectory(paths);
	const state = await loadState(paths);
	const selection = resolveBackendSelection({ policy: options.policy, runMode: options.backend });

	if (!state) {
		return {
			exitCode: DEV_DB_EXIT_CODES.OK,
			text: 'dev-db status: down',
			json: stateToJson(undefined, selection),
		};
	}

	return {
		exitCode: DEV_DB_EXIT_CODES.OK,
		text: `dev-db status: up (${state.backend})`,
		json: stateToJson(state, selection),
	};
};

const url = async (): Promise<LifecycleResult> => {
	const mongoUrl = resolveExternalMongoUrl();
	if (!mongoUrl) {
		throw new DevDbError(
			'No Mongo URL available. Run dev-db up or provide DEV_DB_EXTERNAL_MONGO_URL/MONGO_URL.',
			DEV_DB_EXIT_CODES.BACKEND_NOT_AVAILABLE,
		);
	}

	return {
		exitCode: DEV_DB_EXIT_CODES.OK,
		text: mongoUrl,
		json: {
			urls: {
				mongoUrl,
				mongoOplogUrl: mongoUrl.replace(/\/[^/?]*/, '/local'),
			},
		},
	};
};

const logs = async (): Promise<LifecycleResult> => {
	const paths = getDevDbPaths();
	await ensureStateDirectory(paths);
	const state = await loadState(paths);
	if (!state) {
		return {
			exitCode: DEV_DB_EXIT_CODES.OK,
			text: 'dev-db logs: no running backend',
		};
	}

	const backend = getBackendRegistry()[state.backend];
	const output = await backend.logs(state);
	return {
		exitCode: DEV_DB_EXIT_CODES.OK,
		text: output,
		json: { state },
	};
};

const doctor = async (): Promise<LifecycleResult> => {
	const paths = getDevDbPaths();
	await ensureStateDirectory(paths);
	const state = await loadState(paths);

	return {
		exitCode: DEV_DB_EXIT_CODES.OK,
		text: state ? `doctor: state file is valid (${state.backend})` : 'doctor: no state found',
		json: {
			paths,
			state: state || null,
		},
	};
};

const reset = async (options: LifecycleOptions): Promise<LifecycleResult> => {
	return withLock(async () => {
		const paths = getDevDbPaths();
		const state = await loadState(paths);
		if (state) {
			const backend = getBackendRegistry()[state.backend];
			await backend.reset(state);
		}

		await clearState(paths);
		return {
			exitCode: DEV_DB_EXIT_CODES.OK,
			text: `dev-db reset completed${options.seedProfile ? ` (seed=${options.seedProfile})` : ''}`,
			json: {
				seedProfile: options.seedProfile || 'minimal',
				state: null,
			},
		};
	});
};

export const runLifecycleCommand = async (command: LifecycleCommand, options: LifecycleOptions = {}): Promise<string> => {
	const mode = options.outputMode || 'text';

	try {
		const result = await (async () => {
			switch (command) {
				case 'up':
					return up(options);
				case 'down':
					return down();
				case 'status':
					return status(options);
				case 'url':
					return url();
				case 'logs':
					return logs();
				case 'doctor':
					return doctor();
				case 'reset':
					return reset(options);
				default:
					throw new DevDbError(`Unknown command: ${command}`, DEV_DB_EXIT_CODES.INVALID_ARGUMENT);
			}
		})();

		process.exitCode = result.exitCode;
		return format(result, mode);
	} catch (error) {
		const devDbError =
			error instanceof DevDbError
				? error
				: new DevDbError((error as Error).message, DEV_DB_EXIT_CODES.UNEXPECTED_ERROR);
		process.exitCode = devDbError.code;

		if (mode === 'json') {
			return JSON.stringify(
				{
					exitCode: devDbError.code,
					error: devDbError.name,
					message: devDbError.message,
					details: devDbError.details || null,
				},
				null,
				2,
			);
		}

		return `dev-db error (${devDbError.code}): ${devDbError.message}`;
	}
};
