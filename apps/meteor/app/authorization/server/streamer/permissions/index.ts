import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Permissions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

Meteor.methods<ServerMethods>({
	async 'permissions/get'(updatedAt?: Date) {
		check(updatedAt, Match.Maybe(Date));

		// TODO: should we return this for non logged users?
		// TODO: we could cache this collection

		const records = await Permissions.find(updatedAt && { _updatedAt: { $gt: updatedAt } }).toArray();

		if (updatedAt instanceof Date) {
			return {
				update: records,
				remove: await Permissions.trashFindDeletedAfter(updatedAt, {}, { projection: { _id: 1, _deletedAt: 1 } }).toArray(),
			};
		}

		return records;
	},
});
