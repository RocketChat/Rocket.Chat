import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { Permissions } from '../../../../models/server/raw';

Meteor.methods({
	async 'permissions/get'(updatedAt: Date) {
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
