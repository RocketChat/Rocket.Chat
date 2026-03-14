import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { addRoomRole } from './helpers';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addRoomOwner(rid: IRoom['_id'], userId: IUser['_id']): boolean;
	}
}

export const addRoomOwner = async (fromUserId: IUser['_id'], rid: IRoom['_id'], userId: IUser['_id']): Promise<boolean> => {
	return addRoomRole(fromUserId, rid, userId, 'owner', 'addRoomOwner');
};

Meteor.methods<ServerMethods>({
	async addRoomOwner(rid, userId) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomOwner',
			});
		}

		return addRoomOwner(uid, rid, userId);
	},
});
