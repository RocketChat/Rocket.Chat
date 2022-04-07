import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { MessageAttachment } from '@rocket.chat/core-typings';

import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

export const attachMessage = function (
	message: IMessage,
	room: IRoom,
): {
	text: string;
	author_name?: string;
	author_icon: string;
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
		author_name: username,
		author_icon: getUserAvatarURL(username),
		message_link: `${roomCoordinator.getRouteLink(room.t, room)}?msg=${_id}`,
		attachments,
		ts,
	};
};
