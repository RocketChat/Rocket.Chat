import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { callbacks } from '../../lib/callbacks';
import { AppEvents, Apps } from '../../ee/server/apps/orchestrator';

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
			callbacks.run('afterLogoutCleanUp', user);
		});

		// App IPostUserLogout event hook
		await Apps.triggerEvent(AppEvents.IPostUserLoggedOut, user);
	},
});
