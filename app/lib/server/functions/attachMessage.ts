import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { roomTypes } from '../../../utils/server';
import { IMessage } from '../../../../definition/IMessage';
import { IRoom } from '../../../../definition/IRoom';

export const attachMessage = function (message: IMessage, room: IRoom): {} {
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
		messageLink: `${roomTypes.getRouteLink(room.t, room)}?msg=${_id}`,
		attachments,
		ts,
	};
};
