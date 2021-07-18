import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { actionLinks } from '../../action-links/client';
import { APIClient } from '../../utils/client';
import { Messages } from '../../models';

actionLinks.register('joinLivechatWebRTCCall', function(message) {
	if (Session.get('openedRoom')) {
		const updatedMessage = Messages.findOne({ _id: message._id });
		if (updatedMessage.callStatus === 'declined' || updatedMessage.callStatus === 'ended') {
			toastr.info(TAPi18n.__('Call Already Ended', ''));
		} else {
			window.open(`/meet/${ message.rid }`, message.rid);
		}
	}
});

actionLinks.register('endLivechatWebRTCCall', async function(message) {
	if (Session.get('openedRoom')) {
		const updatedMessage = Messages.findOne({ _id: message._id });
		if (updatedMessage.callStatus === 'declined' || updatedMessage.callStatus === 'ended') {
			toastr.info(TAPi18n.__('Call Already Ended', ''));
		} else {
			await APIClient.v1.put(`livechat/webrtc.call/${ message._id }`, {}, { rid: updatedMessage.rid, status: 'ended' });
		}
	}
});
