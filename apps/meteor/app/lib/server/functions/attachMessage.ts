import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import type { IMessage } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { MessageAttachment } from '@rocket.chat/core-typings';

export const attachMessage = function (
	message: IMessage,
	room: IRoom,
): {
	text: string;
	authorName?: string;
	authorIcon: string;
	message_link: string;
	attachments?: MessageAttachment[];
	ts: Date;
} {
	const {
		msg,
		u: { username },
		ts,
		attachments,
		_id,
	} = message;
	return {
		text: msg,
		authorName: username,
		authorIcon: getUserAvatarURL(username),
		// eslint-disable-next-line @typescript-eslint/camelcase
		message_link: `${roomCoordinator.getRouteLink(room.t, room)}?msg=${_id}`,
		attachments,
		ts,
	};
};
