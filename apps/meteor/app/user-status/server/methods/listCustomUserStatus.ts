import type { ICustomUserStatus } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { CustomUserStatus } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		listCustomUserStatus(): ICustomUserStatus[];
	}
}

Meteor.methods<ServerMethods>({
	async listCustomUserStatus() {
		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'listCustomUserStatus',
			});
		}

		return CustomUserStatus.find({}).toArray();
	},
});
