import type { MessageTypesValues, IRoom } from '@rocket.chat/core-typings';
import { Rooms, Messages } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

export async function getRoomMessages({ rid }: { rid: string }) {
	const room = await Rooms.findOneById<Pick<IRoom, 't'>>(rid, { projection: { t: 1 } });
	if (room?.t !== 'l') {
		throw new Meteor.Error('invalid-room');
	}

	const ignoredMessageTypes: MessageTypesValues[] = [
		'livechat_navigation_history',
		'livechat_transcript_history',
		'command',
		'livechat-close',
		'livechat-started',
		'livechat_video_call',
	];

	return Messages.findVisibleByRoomIdNotContainingTypes(rid, ignoredMessageTypes, {
		sort: { ts: 1 },
	});
}
