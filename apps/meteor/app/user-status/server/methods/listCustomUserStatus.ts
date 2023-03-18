import { Meteor } from 'meteor/meteor';
import { CustomUserStatus } from '@rocket.chat/models';
import type { ICustomUserStatus } from '@rocket.chat/core-typings';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		listCustomUserStatus(): Promise<ICustomUserStatus[]>;
	}
}

Meteor.methods({
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
