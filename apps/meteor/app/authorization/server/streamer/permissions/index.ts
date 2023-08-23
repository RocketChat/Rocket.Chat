import type { IPermission, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { Permissions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { WithId } from 'mongodb';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'permissions/get'(
			updatedSince?: Date,
		): Promise<IPermission[] | { update: IPermission[]; remove: WithId<RocketChatRecordDeleted<IPermission>>[] }>;
	}
}

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
