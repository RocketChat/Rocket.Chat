import { parse } from 'cookie';

export const isWidget = (headers: Record<string, any> = {}): boolean => {
	const { rc_room_type: roomType, rc_is_widget: isWidget } = parse(headers.cookie || '');

	const isLivechatRoom = roomType && roomType === 'l';
	return !!(isLivechatRoom && isWidget === 't');
};
