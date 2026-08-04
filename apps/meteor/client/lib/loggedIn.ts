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
	const handler = async () => {
		cleanup?.();
		const ret = await cb();
		if (typeof ret === 'function') {
			cleanup = ret;
		}
	};

	const stop = getDdpSdk().account.onLogin(handler);
	if (isLoggedIn()) handler();

	return () => {
		stop();
		cleanup?.();
	};
};
