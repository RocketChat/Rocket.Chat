import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { watch } from './watch';
import { Users } from '../../stores';

declare module 'meteor/accounts-base' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Accounts {
		function onLogin<TCallback extends (loginDetails: unknown) => void>(
			func: TCallback,
		): {
			callback: TCallback;
			stop: () => void;
		};

		function onLogout<TCallback extends (options: { user: Meteor.User; connection: Meteor.Connection }) => void>(
			func: TCallback,
		): {
			callback: TCallback;
			stop: () => void;
		};
	}
}

// TODO: aggregating functions in a object allows us to pass it as a value through React Context
// similar to what we do with the router
class AccountsFacade {
	readonly getUserId = () => Tracker.nonreactive(() => Accounts.userId()) ?? undefined;

	readonly getUser = () => {
		const userId = this.getUserId();
		if (!userId) return undefined;
		return Users.state.get(userId);
	};

	readonly watchUserId = () => Accounts.userId() ?? undefined;

	readonly watchUser = () => {
		const userId = this.watchUserId();
		if (!userId) return undefined;
		return watch(Users.use, (state) => state.get(userId));
	};

	readonly getStorage = () => Accounts.storageLocation;

	readonly getStoredUserId = () => this.getStorage().getItem(Accounts.USER_ID_KEY) ?? undefined;

	readonly getStoredLoginToken = () => this.getStorage().getItem(Accounts.LOGIN_TOKEN_KEY) ?? undefined;

	readonly deleteStoredUserId = () => this.getStorage().removeItem(Accounts.USER_ID_KEY);

	readonly onLogin = (callback: () => void): (() => void) => {
		const subscription = Accounts.onLogin<typeof callback>(callback);

		return () => {
			subscription.stop();
		};
	};

	readonly onLogout = (callback: () => void): (() => void) => {
		const subscription = Accounts.onLogout<typeof callback>(callback);

		return () => {
			subscription.stop();
		};
	};

	readonly logout = () =>
		new Promise<void>((resolve, reject) => {
			// FIXME: cannot invoke `Account.logout` because SAML overrides `Meteor.logout` instead
			Meteor.logout((err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
}

/** @deprecated avoid consuming this directly */
export const accounts = new AccountsFacade();
