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

async function lockUser(userId: string): Promise<() => void> {
	return acquireLock(`user-${ userId }`);
}

/* Always acquire locks in the same order to avoid deadlocks!
   first acquire the lock for the user and then the lock for the channel
*/
async function acquireLocks(keys: string[]): Promise<(() => void)[]> {
	const releases = await Promise.all(keys.map((key) => acquireLock(key)));
	return releases;
}

export { acquireLock, acquireLocks, lockUser };
