import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:searchAgent'(username: string): { _id: string; username?: string } | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:searchAgent'(username) {
		methodDeprecationLogger.method('livechat:searchAgent', '7.0.0');

		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:searchAgent',
			});
		}

		if (!username || typeof username.valueOf() !== 'string') {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'livechat:searchAgent',
			});
		}

		const user = await Users.findOneByUsernameIgnoringCase<Pick<IUser, 'username' | '_id'>>(username, {
			projection: { _id: 1, username: 1 },
		});

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:searchAgent',
			});
		}

		return user;
	},
});
