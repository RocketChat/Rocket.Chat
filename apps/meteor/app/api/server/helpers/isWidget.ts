import { parse } from 'cookie';

import { API } from '../api';

API.helperMethods.set('isWidget', function _isWidget() {
	// @ts-expect-error
	const { headers } = this.request;

	const { rc_room_type: roomType, rc_is_widget: isWidget } = parse(headers.cookie || '');

	const isLivechatRoom = roomType && roomType === 'l';
	return !!(isLivechatRoom && isWidget === 't');
});
