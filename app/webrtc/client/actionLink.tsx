import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { actionLinks } from '../../action-links/client';
import { APIClient } from '../../utils/client';
import { Messages } from '../../models/client';
import { IMessage } from '../../../definition/IMessage';

actionLinks.register('joinLivechatWebRTCCall', (message: IMessage) => {
	const { callStatus, rid } = Messages.findOne({ _id: message._id });
	if (callStatus === 'declined' || callStatus === 'ended') {
		toastr.info(TAPi18n.__('Call_Already_Ended'));
		return;
	}
	window.open(`/meet/${ rid }`, rid);
});

actionLinks.register('endLivechatWebRTCCall', async (message: IMessage) => {
	const { callStatus, rid } = Messages.findOne({ _id: message._id });
	if (callStatus === 'declined' || callStatus === 'ended') {
		toastr.info(TAPi18n.__('Call_Already_Ended'));
		return;
	}
	await APIClient.v1.put(`livechat/webrtc.call/${ message._id }`, {}, { rid, status: 'ended' });
});
