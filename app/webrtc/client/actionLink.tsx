import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { actionLinks } from '../../action-links/client';
import { APIClient } from '../../utils/client';
import { Rooms } from '../../models/client';
import { IMessage } from '../../../definition/IMessage';
import { Notifications } from '../../notifications/client';

actionLinks.register('joinLivechatWebRTCCall', (message: IMessage) => {
	const { callStatus, _id } = Rooms.findOne({ _id: message.rid });
	if (callStatus === 'declined' || callStatus === 'ended') {
		toastr.info(TAPi18n.__('Call_Already_Ended'));
		return;
	}
	window.open(`/meet/${_id}`, _id);
});

actionLinks.register('endLivechatWebRTCCall', async (message: IMessage) => {
	const { callStatus, _id } = Rooms.findOne({ _id: message.rid });
	if (callStatus === 'declined' || callStatus === 'ended') {
		toastr.info(TAPi18n.__('Call_Already_Ended'));
		return;
	}
	await APIClient.v1.put(`livechat/webrtc.call/${message._id}`, {}, { rid: _id, status: 'ended' });
	Notifications.notifyRoom(_id, 'webrtc', 'callStatus', { callStatus: 'ended' });
});
