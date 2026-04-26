import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { Filter } from 'mongodb';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		lookupUserByIdentifier(field: 'username' | 'email', value: string): Promise<Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'> | null>;
	}
}

Meteor.methods<ServerMethods>({
	async lookupUserByIdentifier(field, value) {
		check(field, String);
		check(value, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-logged-in', 'You must be logged in', { method: 'lookupUserByIdentifier' });
		}

		let query: Filter<IUser>;
		switch (field) {
			case 'email':
				query = { 'emails.address': value.toLowerCase().trim() };
				break;
			case 'username':
				query = { username: value.trim() };
				break;
			default:
				throw new Meteor.Error('error-invalid-field', 'Invalid identifier field', { method: 'lookupUserByIdentifier' });
		}

		return Users.findOne(query, {
			projection: {
				username: 1,
				name: 1,
				avatarETag: 1,
			},
		});
	},
});
