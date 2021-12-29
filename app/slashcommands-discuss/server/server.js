import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { _ } from 'meteor/underscore';

import { slashCommands } from '../../utils';
import { api } from '../../../server/sdk/api';
import { Rooms, Messages } from '../../models';

function roomDiscussionOrDirect(roomOrRoomId) {
	let room;
	if (Match.test(roomOrRoomId, String)) {
		room = Rooms.findOneByIdOrName(roomOrRoomId);
	}
	return room?.t === 'd' || room?.prid;
}

async function notify(msg, rid) {
	await api.broadcast('notify.ephemeralMessage', Meteor.userId(), rid, {
		msg,
	});
}

function getDiscussionObjectFromThreadId(item, params) {
	const message = Messages.findOneByRoomIdAndMessageId(item.rid, item.tmid);
	return {
		prid: item.rid,
		pmid: item.tmid,
		t_name: params || message.msg,
		users: _.union([Meteor.userId()], message.replies),
	};
}

function getDiscussionObjectFromCLI(item, params) {
	// will never return null since all matches are optional
	const [, , roomName, discussionName] = /(^#([^\s]+)\s*)?(.+)?$/.exec(params);

	let roomId = item.rid;
	if (roomName) {
		const room = Rooms.findOneByName(roomName);

		if (!room) {
			return;
		}

		roomId = room._id;
	}

	return {
		prid: roomId,
		t_name: discussionName,
	};
}

// eslint-disable-next-line no-unused-vars
async function discuss(command, params, item) {
	if (!Match.test(params, String)) {
		return;
	}

	let discussion;
	if (item.tmid) {
		discussion = getDiscussionObjectFromThreadId(item, params);
	} else {
		discussion = getDiscussionObjectFromCLI(item, params);

		if (!discussion) {
			await notify('room not found', item.rid);
			return;
		}

		if (roomDiscussionOrDirect(discussion.prid)) {
			await notify("this room isn't public channel or private group, either pass a `#RoomName` or execute `/discuss` in a different room", item.rid);
			return;
		}

		if (!discussion.t_name) {
			await notify('you must provide a discussion name', item.rid);
			return;
		}
	}

	Meteor.call('createDiscussion', discussion);
}

slashCommands.add('discuss', discuss, {
	description: 'Create a new discussion',
	params: '[#channel] [discussion name]',
	permission: ['start-discussion-other-user', 'start-discussion'],
});
