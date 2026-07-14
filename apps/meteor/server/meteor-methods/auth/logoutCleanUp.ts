import { AppEvents, Apps } from '@rocket.chat/apps';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../app/lib/server/lib/deprecationWarningLogger';
import { afterLogoutCleanUpCallback } from '../../lib/callbacks/afterLogoutCleanUpCallback';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		logoutCleanUp(user: IUser): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async logoutCleanUp(user) {
		methodDeprecationLogger.method('logoutCleanUp', '9.0.0', '/v1/users.logout');
		check(user, Object);

		setImmediate(() => {
			void afterLogoutCleanUpCallback.run(user);
		});

		// App IPostUserLogout event hook
		await Apps.self?.triggerEvent(AppEvents.IPostUserLoggedOut, user);
	},
});
