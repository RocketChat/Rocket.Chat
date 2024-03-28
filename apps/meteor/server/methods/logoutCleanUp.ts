import { AppEvents, Apps } from '@rocket.chat/apps';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { afterLogoutCleanUpCallback } from '../../lib/callbacks/afterLogoutCleanUpCallback';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		logoutCleanUp(user: IUser): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async logoutCleanUp(user) {
		check(user, Object);

		setImmediate(() => {
			void afterLogoutCleanUpCallback.run(user);
		});

		// App IPostUserLogout event hook
		await Apps?.triggerEvent(AppEvents.IPostUserLoggedOut, user);
	},
});
