import { getDdpSdk } from './sdk/ddpSdk';
import { getUserId } from './user';

const isLoggedIn = () => {
	const uid = getUserId();
	return !!uid;
};

export const whenLoggedIn = () => {
	if (isLoggedIn()) {
		return Promise.resolve();
	}

	return new Promise<void>((resolve) => {
		const stop = getDdpSdk().account.onLogin(() => {
			stop();
			resolve();
		});
	});
};

export const onLoggedIn = (cb: (() => () => void) | (() => Promise<() => void>) | (() => void)) => {
	let cleanup: (() => void) | undefined;
	let disposed = false;
	let generation = 0;
	const runCleanup = (cleanupFn: () => void) => {
		try {
			cleanupFn();
		} catch (error) {
			console.error(error);
		}
	};
	const runCurrentCleanup = () => {
		const currentCleanup = cleanup;
		cleanup = undefined;
		if (currentCleanup) {
			runCleanup(currentCleanup);
		}
	};
	// Run `cb` detached instead of awaiting it inside the onLogin hook.
	// accounts-base 3.3 (Meteor 3.5) awaits every Accounts.onLogin hook before
	// invoking the login method's userCallback (3.2 fired them and returned
	// immediately). If `cb` awaits work that only completes once login has
	// finished (e.g. an authenticated subscription/method), awaiting it here
	// deadlocks the login callback — the SAML/login flows never resolve. Keep
	// the hook synchronous so login completes, then let `cb` settle.
	const handler = () => {
		const currentGeneration = ++generation;
		runCurrentCleanup();
		void (async () => {
			try {
				const ret = await cb();
				if (typeof ret === 'function') {
					if (disposed || currentGeneration !== generation) {
						runCleanup(ret);
					} else {
						cleanup = ret;
					}
				}
			} catch (error) {
				console.error(error);
			}
		})();
	};

	const stop = getDdpSdk().account.onLogin(handler);
	if (isLoggedIn()) handler();

	return () => {
		disposed = true;
		stop();
		runCurrentCleanup();
	};
};
