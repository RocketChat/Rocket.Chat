import type { ICustomUserStatus } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { CustomUserStatus } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		listCustomUserStatus(): ICustomUserStatus[];
	}
}

Meteor.methods<ServerMethods>({
	async listCustomUserStatus() {
		methodDeprecationLogger.method('listCustomUserStatus', '9.0.0', '/v1/custom-user-status.list');
		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'listCustomUserStatus',
			});
		}

		return CustomUserStatus.find({}).toArray();
	},
});
