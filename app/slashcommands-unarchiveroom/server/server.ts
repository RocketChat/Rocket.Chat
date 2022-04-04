import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Rooms, Messages } from '../../models/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { settings } from '../../settings/server';
import { api } from '../../../server/sdk/api';
import { roomCoordinator } from '../../../server/lib/rooms/roomCoordinator';

function Unarchive(_command: 'unarchive', params: string, item: Record<string, string>): void | Promise<void> | Function {
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
		return api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Channel_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [channel],
				lng: settings.get('Language') || 'en',
			}),
		});
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

	return Unarchive;
}

slashCommands.add(
	'unarchive',
	Unarchive,
	{
		description: 'Unarchive',
		params: '#channel',
		permission: 'unarchive-room',
	},
	undefined,
	false,
	undefined,
	undefined,
);
