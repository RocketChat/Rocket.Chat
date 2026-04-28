import { Accounts } from 'meteor/accounts-base';

import { getUserId, userIdStore } from './user';

const isLoggedIn = () => {
	const uid = getUserId();
	return !!uid;
};

/**
 * Fire `cb` whenever the local userId transitions from absent → present.
 *
 * `Accounts.onLogin` would normally cover this, but Meteor only invokes
 * the onLogin hook from inside a Tracker.autorun that waits for
 * `Meteor.userAsync()` to resolve to a real user doc. When a login goes
 * through our REST fallback (e.g. logout → fresh login while DDPSDK is
 * reconnecting), the user document never lands in Meteor.users — it
 * normally arrives as a DDP collection frame, but the REST endpoint
 * only returns the method result. The autorun then sees a null user
 * forever, and onLogin never fires. By piggybacking on userIdStore (which
 * is updated synchronously the moment Accounts.connection.userId() is
 * set), we get a reliable login signal regardless of how the user doc
 * eventually arrives.
 */
const subscribeToLogin = (handler: () => void): (() => void) => {
	let lastSeen = userIdStore.getState();
	return userIdStore.subscribe((next) => {
		if (next === lastSeen) return;
		const wasLoggedOut = !lastSeen;
		lastSeen = next;
		if (next && wasLoggedOut) {
			handler();
		}
	});
};

export const whenLoggedIn = () => {
	if (isLoggedIn()) {
		return Promise.resolve();
	}

	return new Promise<void>((resolve) => {
		const stop = subscribeToLogin(() => {
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

	// Belt-and-braces: still register with Accounts.onLogin so consumers
	// pick up loginDetails when Meteor's own autorun does fire (resume on
	// page load, where the user doc lands via DDP and unblocks the
	// autorun). The userIdStore subscription covers everything else.
	const accountsSubscription = Accounts.onLogin(handler);
	const stopUserIdSubscription = subscribeToLogin(handler);
	if (isLoggedIn()) handler();

	return () => {
		accountsSubscription.stop();
		stopUserIdSubscription();
		cleanup?.();
	};
};
