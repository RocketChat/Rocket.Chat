import { parseCookie } from 'cookie';

export const isWidget = (headers: Headers): boolean => {
	const { rc_room_type: roomType, rc_is_widget: isWidget } = parseCookie(headers.get('cookie') || '');

	const isLivechatRoom = roomType && roomType === 'l';
	return !!(isLivechatRoom && isWidget === 't');
};
