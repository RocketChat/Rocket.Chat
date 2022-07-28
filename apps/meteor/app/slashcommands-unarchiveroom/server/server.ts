import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Rooms, Messages } from '../../models/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { api } from '../../../server/sdk/api';
import { roomCoordinator } from '../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';

slashCommands.add({
	command: 'unarchive',
	callback: function Unarchive(_command: 'unarchive', params, item): void {
		let channel = params.trim();
		let room;

		if (channel === '') {
			room = Rooms.findOneById(item.rid);
			channel = room.name;
		} else {
			channel = channel.replace('#', '');
			room = Rooms.findOneByName(channel);
		}

		const userId = Meteor.userId() as string;

		if (!room) {
			api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		// You can not archive direct messages.
		if (!roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.ARCHIVE)) {
			return;
		}

		if (!room.archived) {
			api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Channel_already_Unarchived', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		Meteor.call('unarchiveRoom', room._id);

		Messages.createRoomUnarchivedByRoomIdAndUser(room._id, Meteor.user());
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Channel_Unarchived', {
				postProcess: 'sprintf',
				sprintf: [channel],
				lng: settings.get('Language') || 'en',
			}),
		});
	},
	options: {
		description: 'Unarchive',
		params: '#channel',
		permission: 'unarchive-room',
	},
});
