
import { getAvatarUrlFromUsername } from '/app/utils';
import { roomTypes } from '/app/utils';
export const attachMessage = function(message, room) {
	const { msg, u: { username }, ts, attachments, _id } = message;
	return {
		text: msg,
		author_name: username,
		author_icon: getAvatarUrlFromUsername(username),
		message_link: `${ roomTypes.getRouteLink(room.t, room) }?msg=${ _id }`,
		attachments,
		ts,
	};
};
