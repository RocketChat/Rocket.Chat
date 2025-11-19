import { Accounts } from 'meteor/accounts-base';

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
		const subscription = Accounts.onLogin(() => {
			subscription.stop();
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

	const subscription = Accounts.onLogin(handler);
	if (isLoggedIn()) handler();

	return () => {
		subscription.stop();
		cleanup?.();
	};
};
