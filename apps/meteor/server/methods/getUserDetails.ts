import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getUserDetails(userId: IUser['_id']): Promise<Partial<IUser> | null>;
	}
}

Meteor.methods<ServerMethods>({
	async getUserDetails(userId) {
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-logged-in', 'You must be logged in', { method: 'getUserDetails' });
		}

		return Users.findOneById(userId, {
			projection: {
				username: 1,
				name: 1,
				emails: 1,
				roles: 1,
				customFields: 1,
				createdAt: 1,
				lastLogin: 1,
				bio: 1,
				nickname: 1,
				statusText: 1,
			},
		});
	},
});
