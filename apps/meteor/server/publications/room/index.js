import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { canAccessRoom, hasPermission } from '../../../app/authorization/server';
import { Rooms } from '../../../app/models/server';
import { settings } from '../../../app/settings/server';
import { roomFields } from '../../modules/watchers/publishFields';

const roomMap = (record) => {
	if (record) {
		return _.pick(record, ...Object.keys(roomFields));
	}
	return {};
};

Meteor.methods({
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

	'getRoomByTypeAndName'(type, name) {
		const userId = Meteor.userId();

		if (!userId && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomByTypeAndName',
			});
		}

		const roomFind = roomCoordinator.getRoomFind(type);

		const room = roomFind ? roomFind.call(this, name) : Rooms.findByTypeAndNameOrId(type, name);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'getRoomByTypeAndName',
			});
		}

		if (!canAccessRoom(room, { _id: userId })) {
			throw new Meteor.Error('error-no-permission', 'No permission', {
				method: 'getRoomByTypeAndName',
			});
		}

		if (settings.get('Store_Last_Message') && !hasPermission(userId, 'preview-c-room')) {
			delete room.lastMessage;
		}

		return roomMap(room);
	},
});
