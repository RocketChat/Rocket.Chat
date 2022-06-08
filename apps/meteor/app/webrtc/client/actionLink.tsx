import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IMessage } from '@rocket.chat/core-typings';

import { actionLinks } from '../../action-links/client';
import { APIClient } from '../../utils/client';
import { Rooms } from '../../models/client';
import { Notifications } from '../../notifications/client';
import { dispatchToastMessage } from '../../../client/lib/toast';

actionLinks.register('joinLivechatWebRTCCall', (message: IMessage) => {
	const { callStatus, _id } = Rooms.findOne({ _id: message.rid });
	if (callStatus === 'declined' || callStatus === 'ended') {
		dispatchToastMessage({ type: 'info', message: TAPi18n.__('Call_Already_Ended') });
		return;
	}
	window.open(`/meet/${_id}`, _id);
});

actionLinks.register('endLivechatWebRTCCall', async (message: IMessage) => {
	const { callStatus, _id } = Rooms.findOne({ _id: message.rid });
	if (callStatus === 'declined' || callStatus === 'ended') {
		dispatchToastMessage({ type: 'info', message: TAPi18n.__('Call_Already_Ended') });
		return;
	}
	await APIClient.put(`/v1/livechat/webrtc.call/${message._id}`, { rid: _id, status: 'ended' });
	Notifications.notifyRoom(_id, 'webrtc', 'callStatus', { callStatus: 'ended' });
});
