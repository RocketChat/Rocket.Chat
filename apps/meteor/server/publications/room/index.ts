import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import type { IRoom, RoomType } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { canAccessRoomAsync } from '../../../app/authorization/server';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { Rooms } from '../../../app/models/server';
import { settings } from '../../../app/settings/server';
import { roomFields } from '../../modules/watchers/publishFields';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'rooms/get'(updatedAt?: Date): IRoom[] | { update: IRoom[]; remove: IRoom[] };
		'getRoomByTypeAndName': (type: RoomType, name: string) => Partial<IRoom>;
	}
}

const roomMap = (record: IRoom) => {
	if (record) {
		return _.pick(record, ...Object.keys(roomFields));
	}
	return {};
};

Meteor.methods<ServerMethods>({
	'rooms/get'(updatedAt) {
		const options = { fields: roomFields };
		const user = Meteor.userId();

		if (!user) {
			if (settings.get('Accounts_AllowAnonymousRead')) {
				return Rooms.findByDefaultAndTypes(true, ['c'], options).fetch();
			}
			return [];
		}

		if (updatedAt instanceof Date) {
			return {
				update: Rooms.findBySubscriptionUserIdUpdatedAfter(user, updatedAt, options).fetch(),
				remove: Rooms.trashFindDeletedAfter(updatedAt, {}, { fields: { _id: 1, _deletedAt: 1 } }).fetch(),
			};
		}

		return Rooms.findBySubscriptionUserId(user, options).fetch();
	},

	async 'getRoomByTypeAndName'(type, name) {
		const userId = Meteor.userId();

		if (!userId && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomByTypeAndName',
			});
		}

		const roomFind = roomCoordinator.getRoomFind(type);

		const room = roomFind ? await roomFind.call(this, name) : Rooms.findByTypeAndNameOrId(type, name);

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
