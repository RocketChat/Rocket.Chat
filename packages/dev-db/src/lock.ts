import fs from 'node:fs/promises';
import { loadState, type DevDbPaths } from './state-store';
import { LockConflictError } from './errors';

const LOCK_STALE_AFTER_MS = 5 * 60 * 1000;

type LockPayload = {
	pid: number;
	createdAt: string;
};

const isProcessAlive = (pid: number): boolean => {
	if (pid <= 0) {
		return false;
	}

	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
};

const isStaleLock = async (paths: DevDbPaths): Promise<boolean> => {
	try {
		const raw = await fs.readFile(paths.lockFile, 'utf8');
		const payload = JSON.parse(raw) as LockPayload;
		const ageMs = Date.now() - new Date(payload.createdAt).getTime();

		if (!Number.isNaN(ageMs) && ageMs > LOCK_STALE_AFTER_MS) {
			return true;
		}

		if (!isProcessAlive(payload.pid)) {
			return true;
		}

		const state = await loadState(paths);
		if (state?.owner?.pid && !isProcessAlive(state.owner.pid)) {
			return true;
		}

		return false;
	} catch {
		return true;
	}
};

export const acquireLock = async (paths: DevDbPaths): Promise<void> => {
	const payload: LockPayload = {
		pid: process.pid,
		createdAt: new Date().toISOString(),
	};

	try {
		await fs.writeFile(paths.lockFile, `${JSON.stringify(payload)}\n`, { flag: 'wx' });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
			throw error;
		}

		if (!(await isStaleLock(paths))) {
			throw new LockConflictError();
		}

		await fs.rm(paths.lockFile, { force: true });
		await fs.writeFile(paths.lockFile, `${JSON.stringify(payload)}\n`, { flag: 'wx' });
	}
};

export const releaseLock = async (paths: DevDbPaths): Promise<void> => {
	await fs.rm(paths.lockFile, { force: true });
};
