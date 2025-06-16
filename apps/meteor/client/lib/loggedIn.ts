import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

const isLoggedIn = () => {
	const uid = Tracker.nonreactive(() => Meteor.userId());
	return uid !== null;
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
