/* eslint-disable @typescript-eslint/camelcase */
import { Meteor } from 'meteor/meteor';

import { slashCommand } from '../../utils/lib/slashCommand';
import { api } from '../../../server/sdk/api';
import { Rooms, Messages } from '../../models/server';
import { IRoom } from '../../../definition/IRoom';
import { IMessage } from '../../../definition/IMessage';

interface IDiscussion {
	prid: string;
	t_name: string;
	pmid?: string;
	users?: Array<string>;
	reply?: string;
}

function roomDiscussionOrDirect(roomId: string): boolean {
	const room: IRoom = Rooms.findOneByIdOrName(roomId);
	return room?.t === 'd' || room?.prid !== undefined;
}

async function notify(msg: string, rid: string): Promise<void> {
	await api.broadcast('notify.ephemeralMessage', Meteor.userId() as string, rid, {
		msg,
	});
}

function getDiscussionObjectFromThreadId(item: any, params: string): IDiscussion {
	const message: IMessage = Messages.findOneByRoomIdAndMessageId(item.rid, item.tmid);
	return {
		prid: item.rid,
		pmid: item.tmid,
		t_name: params || message.msg,
		users: Messages.getThreadFollowsByThreadId(item.tmid) || [],
	};
}

function getDiscussionObjectFromCLI(item: any, params: string): IDiscussion | undefined {
	// will never return null since all matches are optional
	const [, , roomName, discussionName]: Array<string> = /(^#([^\s]+)\s*)?(.+)?$/.exec(
		params,
	) as RegExpExecArray;

	let roomId: string = item.rid;
	if (roomName !== undefined) {
		const room = Rooms.findOneByName(roomName);

		if (room === undefined) {
			return;
		}

		roomId = room._id;
	}

	return {
		prid: roomId,
		t_name: discussionName,
	};
}

async function discuss(_command: string, params: any, item: any): Promise<void> {
	if (typeof params !== 'string') {
		return;
	}

	let discussion: IDiscussion | undefined;
	if (item.tmid) {
		discussion = getDiscussionObjectFromThreadId(item, params);
	} else {
		discussion = getDiscussionObjectFromCLI(item, params);

		if (discussion === undefined) {
			await notify('room not found', item.rid);
			return;
		}

		if (roomDiscussionOrDirect(discussion.prid)) {
			await notify(
				// tslint:disable-next-line: quotemark
				"this room isn't public channel or private group, either pass a `#RoomName` or execute `/discuss` in a different room",
				item.rid,
			);
			return;
		}

		if (!discussion.t_name) {
			await notify('you must provide a discussion name', item.rid);
			return;
		}
	}

	Meteor.call('createDiscussion', discussion);
}

slashCommand.add('discuss', discuss, {
	description: 'Create a new discussion',
	params: '[#channel] [discussion name]',
	permission: ['start-discussion-other-user', 'start-discussion'],
});
