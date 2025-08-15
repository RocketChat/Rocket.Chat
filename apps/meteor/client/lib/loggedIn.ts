import { accounts } from '../meteor/facade/accounts';

const isLoggedIn = () => {
	const uid = accounts.getUserId();
	return uid !== null;
};

export const whenLoggedIn = () => {
	if (isLoggedIn()) {
		return Promise.resolve();
	}

	return new Promise<void>((resolve) => {
		const unsubscribe = accounts.onLogin(() => {
			unsubscribe();
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

	const unsubscribe = accounts.onLogin(handler);
	if (isLoggedIn()) handler();

	return () => {
		unsubscribe();
		cleanup?.();
	};
};
