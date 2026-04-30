import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

export type DevDbBackendKind = 'docker' | 'binary' | 'external';

export type DevDbState = {
	version: 1;
	owner: {
		pid: number;
		hostname: string;
		command: string;
	};
	ownershipMarker?: string;
	backend: DevDbBackendKind;
	dbPath?: string;
	volumeName?: string;
	port: number;
	replicaSetName?: string;
	processId?: number;
	containerId?: string;
	startedAt: string;
	updatedAt: string;
};

export type DevDbPaths = {
	rootDir: string;
	stateFile: string;
	lockFile: string;
	logFile: string;
};

const getDefaultRootDir = (): string => {
	const home = os.homedir();
	return path.join(home, '.rocket-chat', 'dev-db');
};

export const getDevDbPaths = (): DevDbPaths => {
	const rootDir = process.env.DEV_DB_STATE_DIR || getDefaultRootDir();

	return {
		rootDir,
		stateFile: path.join(rootDir, 'state.json'),
		lockFile: path.join(rootDir, 'state.lock'),
		logFile: path.join(rootDir, 'dev-db.log'),
	};
};

export const ensureStateDirectory = async (paths: DevDbPaths): Promise<void> => {
	await fs.mkdir(paths.rootDir, { recursive: true });
};

export const loadState = async (paths: DevDbPaths): Promise<DevDbState | undefined> => {
	try {
		const raw = await fs.readFile(paths.stateFile, 'utf8');
		return JSON.parse(raw) as DevDbState;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return undefined;
		}
		throw error;
	}
};

export const saveState = async (paths: DevDbPaths, state: DevDbState): Promise<void> => {
	await fs.writeFile(paths.stateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
};

export const clearState = async (paths: DevDbPaths): Promise<void> => {
	await fs.rm(paths.stateFile, { force: true });
};
