import { isGETWebRTCCall, isPUTWebRTCCallId } from '@rocket.chat/rest-typings';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Settings } from '@rocket.chat/models';

import { Messages, Rooms } from '../../../../models/server';
import { settings as rcSettings } from '../../../../settings/server';
import { API } from '../../../../api/server';
import { settings } from '../lib/livechat';
import { canSendMessage } from '../../../../authorization/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute(
	'livechat/webrtc.call',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETWebRTCCall },
	{
		async get() {
			const room = canSendMessage(
				this.queryParams.rid,
				{
					uid: this.userId,
					username: this.user.username,
					type: this.user.type,
				},
				{},
			);
			if (!room) {
				throw new Error('invalid-room');
			}

			const webrtcCallingAllowed = rcSettings.get('WebRTC_Enabled') === true && rcSettings.get('Omnichannel_call_provider') === 'WebRTC';
			if (!webrtcCallingAllowed) {
				throw new Error('webRTC calling not enabled');
			}

			const config = await settings();
			if (!config.theme || !config.theme.actionLinks || !config.theme.actionLinks.webrtc) {
				throw new Error('invalid-livechat-config');
			}

			let { callStatus } = room;

			if (!callStatus || callStatus === 'ended' || callStatus === 'declined') {
				await Settings.incrementValueById('WebRTC_Calls_Count');
				callStatus = 'ringing';
				await Rooms.setCallStatusAndCallStartTime(room._id, callStatus);
				await Messages.createWithTypeRoomIdMessageAndUser(
					'livechat_webrtc_video_call',
					room._id,
					TAPi18n.__('Join_my_room_to_start_the_video_call'),
					this.user,
					{
						actionLinks: config.theme.actionLinks.webrtc,
					},
				);
			}
			const videoCall = {
				rid: room._id,
				provider: 'webrtc',
				callStatus,
			};
			return API.v1.success({ videoCall });
		},
	},
);

API.v1.addRoute(
	'livechat/webrtc.call/:callId',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isPUTWebRTCCallId },
	{
		async put() {
			const { callId } = this.urlParams;
			const { rid, status } = this.bodyParams;

			const room = canSendMessage(
				rid,
				{
					uid: this.userId,
					username: this.user.username,
					type: this.user.type,
				},
				{},
			);
			if (!room) {
				throw new Error('invalid-room');
			}

			const call = await Messages.findOneById(callId);
			if (!call || call.t !== 'livechat_webrtc_video_call') {
				throw new Error('invalid-callId');
			}

			Livechat.updateCallStatus(callId, rid, status, this.user);

			return API.v1.success({ status });
		},
	},
);
