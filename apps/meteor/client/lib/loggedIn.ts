import { Accounts } from 'meteor/accounts-base';

import { isSdkTransportEnabled } from './sdk/sdkTransportEnabled';
import { getUserId, userIdStore } from './user';

const sdkTransportEnabled = isSdkTransportEnabled();

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

	if (!sdkTransportEnabled) {
		// Flag off: develop's exact implementation — wait on Accounts.onLogin only,
		// no userIdStore bridge.
		return new Promise<void>((resolve) => {
			const subscription = Accounts.onLogin(() => {
				subscription.stop();
				resolve();
			});
		});
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

	// With the SDK transport on, login can land via REST (ddpOverREST) without
	// filling Meteor.users — Accounts.onLogin's autorun would never fire.
	// Bridge off userIdStore as belt-and-braces. With the flag off, the legacy
	// DDP path populates Meteor.users and Accounts.onLogin fires reliably; the
	// extra userIdStore subscription would just double-fire callbacks.
	const accountsSubscription = Accounts.onLogin(handler);
	const stopUserIdSubscription = sdkTransportEnabled ? subscribeToLogin(handler) : undefined;
	if (isLoggedIn()) handler();

	return () => {
		accountsSubscription.stop();
		stopUserIdSubscription?.();
		cleanup?.();
	};
};
