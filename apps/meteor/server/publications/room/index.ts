import type { IOmnichannelRoom, IRoom, RoomType } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { canAccessRoomAsync } from '../../../app/authorization/server';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { settings } from '../../../app/settings/server';
import { roomFields } from '../../../lib/publishFields';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type PublicRoomField = keyof typeof roomFields;
type PublicRoom = Pick<IRoom, PublicRoomField & keyof IRoom> & Pick<IOmnichannelRoom, PublicRoomField & keyof IOmnichannelRoom>;

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'rooms/get'(updatedAt?: Date): IRoom[] | { update: IRoom[]; remove: IRoom[] };
		'getRoomByTypeAndName': (type: RoomType, name: string) => PublicRoom;
	}
}

const roomMap = (record: IRoom | IOmnichannelRoom) => {
	return _.pick(record, ...Object.keys(roomFields)) as PublicRoom;
};

export const roomsGetMethod = async (userId?: string | null, updatedAt?: Date): Promise<IRoom[] | { update: IRoom[]; remove: IRoom[] }> => {
	const options = { projection: roomFields };

	if (!userId) {
		if (settings.get('Accounts_AllowAnonymousRead')) {
			return Rooms.findByDefaultAndTypes(true, ['c'], options).toArray();
		}
		return [];
	}

	if (updatedAt instanceof Date) {
		return {
			update: await (await Rooms.findBySubscriptionUserIdUpdatedAfter(userId, updatedAt, options)).toArray(),
			remove: await Rooms.trashFindDeletedAfter(updatedAt, {}, { projection: { _id: 1, _deletedAt: 1 } }).toArray(),
		};
	}

	return (await Rooms.findBySubscriptionUserId(userId, options)).toArray();
};

Meteor.methods<ServerMethods>({
	async 'rooms/get'(updatedAt) {
		return roomsGetMethod(Meteor.userId(), updatedAt);
	},

	async 'getRoomByTypeAndName'(type, name) {
		if (!type || !name) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'getRoomByTypeAndName',
			});
		}

		const userId = Meteor.userId();

		if (!userId && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomByTypeAndName',
			});
		}

		const roomFind = roomCoordinator.getRoomFind(type);

		const room = roomFind ? await roomFind.call(this, name) : await Rooms.findByTypeAndNameOrId(type, name);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'getRoomByTypeAndName',
			});
		}

		if (userId && !(await canAccessRoomAsync(room, { _id: userId }))) {
			throw new Meteor.Error('error-no-permission', 'No permission', {
				method: 'getRoomByTypeAndName',
			});
		}

		if (settings.get('Store_Last_Message') && userId && !(await hasPermissionAsync(userId, 'preview-c-room'))) {
			delete room.lastMessage;
		}

		return roomMap(room);
	},
});
