import type { IPermission, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Permissions } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { WithId } from 'mongodb';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'permissions/get'(
			updatedSince?: Date,
		): Promise<IPermission[] | { update: IPermission[]; remove: WithId<RocketChatRecordDeleted<IPermission>>[] }>;
	}
}

export const permissionsGetMethod = async (
	updatedAt?: Date,
): Promise<IPermission[] | { update: IPermission[]; remove: WithId<RocketChatRecordDeleted<IPermission>>[] }> => {
	const records = await Permissions.find(updatedAt && { _updatedAt: { $gt: updatedAt } }).toArray();

	if (updatedAt instanceof Date) {
		return {
			update: records,
			remove: await Permissions.trashFindDeletedAfter(updatedAt, {}, { projection: { _id: 1, _deletedAt: 1 } }).toArray(),
		};
	}

	return records;
};

Meteor.methods<ServerMethods>({
	async 'permissions/get'(updatedAt?: Date) {
		check(updatedAt, Match.Maybe(Date));
		// TODO: should we return this for non logged users?
		// TODO: we could cache this collection

		return permissionsGetMethod(updatedAt);
	},
});
