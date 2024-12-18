import { Mutex } from 'async-mutex';

const locks = new Map<string, Mutex>();

async function acquireLock(key: string): Promise<() => void> { // TODO-Hi: Move to a separate file
	if (!locks.has(key)) {
		locks.set(key, new Mutex());
	}

	const mutex = locks.get(key) as Mutex;

	const release = await mutex.acquire(); 	// Acquire the lock and return the release function
	return release;
}


export { acquireLock };
