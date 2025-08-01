import { Authorization } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getUserRoles(): Pick<IUser, '_id' | 'roles' | 'username'>[];
	}
}

Meteor.methods<ServerMethods>({
	async getUserRoles() {
		methodDeprecationLogger.method(
			'getUserRoles',
			'8.0.0',
			'This method is deprecated and will be removed in the future. Use the /v1/roles.getUsersInPublicRoles endpoint instead.',
		);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUserRoles' });
		}

		return Authorization.getUsersFromPublicRoles();
	},
});
