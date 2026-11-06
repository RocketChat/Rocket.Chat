import { AppEvents, Apps } from '@rocket.chat/apps';
import type { IUser } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';

import { afterLogoutCleanUpCallback } from '../lib/callbacks/afterLogoutCleanUpCallback';

export const runUserLogoutCleanUp = async (user: IUser): Promise<void> => {
	setImmediate(() => {
		void afterLogoutCleanUpCallback.run(user);
	});

	await Apps.self?.triggerEvent(AppEvents.IPostUserLoggedOut, user);
};

Accounts.onLogout(async ({ user }: { user?: IUser }) => {
	if (!user) {
		return;
	}

	await runUserLogoutCleanUp(user);
});
