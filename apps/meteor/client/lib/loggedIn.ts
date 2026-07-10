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
	// Run `cb` detached instead of awaiting it inside the onLogin hook.
	// accounts-base 3.3 (Meteor 3.5) awaits every Accounts.onLogin hook before
	// invoking the login method's userCallback (3.2 fired them and returned
	// immediately). If `cb` awaits work that only completes once login has
	// finished (e.g. an authenticated subscription/method), awaiting it here
	// deadlocks the login callback — the SAML/login flows never resolve. Keep
	// the hook synchronous so login completes, then let `cb` settle.
	const handler = () => {
		cleanup?.();
		void (async () => {
			const ret = await cb();
			if (typeof ret === 'function') {
				cleanup = ret;
			}
		})();
	};

	const stop = getDdpSdk().account.onLogin(handler);
	if (isLoggedIn()) handler();

	return () => {
		stop();
		cleanup?.();
	};
};
