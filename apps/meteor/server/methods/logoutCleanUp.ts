import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Apps } from '@rocket.chat/core-services';
import { AppInterface as AppEvents } from '@rocket.chat/apps-engine/definition/metadata';

import { callbacks } from '../../lib/callbacks';

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
			void callbacks.run('afterLogoutCleanUp', user);
		});

		// App IPostUserLogout event hook
		await Apps.triggerEvent(AppEvents.IPostUserLoggedOut, user);
	},
});
