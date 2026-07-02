import { getUserDisplayName } from '@rocket.chat/core-typings';
import type { IMessage, IRoom, MessageAttachment } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server/cached';
import { getUserAvatarURL } from '../../../app/utils/server/getUserAvatarURL';
import { roomCoordinator } from '../rooms/roomCoordinator';

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
	const useRealName = Boolean(settings.get('UI_Use_Real_Name'));
	const {
		msg,
		u: { username, name },
		ts,
		attachments,
		_id,
	} = message;
	return {
		text: msg,
		author_name: getUserDisplayName(name, username, useRealName),
		author_icon: getUserAvatarURL(username) as string,
		message_link: `${roomCoordinator.getRouteLink(room.t, room)}?msg=${_id}`,
		attachments,
		ts,
	};
};
