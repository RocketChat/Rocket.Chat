import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

const PROFILE_FIELDS = ['username', 'name', 'bio', 'nickname', 'statusText', 'department'] as const;

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		searchUsers(
			field: string,
			value: unknown,
			options?: { limit?: number; skip?: number },
		): Promise<Pick<IUser, '_id' | 'username' | 'name' | 'emails' | 'status' | 'avatarETag'>[]>;
	}
}

Meteor.methods<ServerMethods>({
	async searchUsers(field, value, { limit = 20, skip = 0 } = {}) {
		check(field, String);
		check(limit, Match.Optional(Number));
		check(skip, Match.Optional(Number));

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'searchUsers' });
		}

		if (!PROFILE_FIELDS.includes(field as (typeof PROFILE_FIELDS)[number])) {
			throw new Meteor.Error('error-invalid-field', 'Invalid search field', { method: 'searchUsers' });
		}

		return Users.findByProfileField(field, value, {
			projection: {
				username: 1,
				name: 1,
				emails: 1,
				status: 1,
				avatarETag: 1,
			},
			limit,
			skip,
		}).toArray();
	},
});
