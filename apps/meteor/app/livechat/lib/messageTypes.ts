import formatDistance from 'date-fns/formatDistance';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';

import { MessageTypes } from '../../ui-utils/lib/MessageTypes';

MessageTypes.registerType({
	id: 'livechat_navigation_history',
	system: true,
	message: 'New_visitor_navigation',
	data(message: IOmnichannelSystemMessage) {
		return {
			history: message.navigation
				? `${(message.navigation.page.title ? `${message.navigation.page.title} - ` : '') + message.navigation.page.location.href}`
				: '',
		};
	},
});

MessageTypes.registerType({
	id: 'livechat_transfer_history',
	system: true,
	message: 'New_chat_transfer',
	data(message: IOmnichannelSystemMessage) {
		if (!message.transferData) {
			return {
				transfer: '',
			};
		}

		const { comment } = message.transferData;
		const commentLabel = comment && comment !== '' ? '_with_a_comment' : '';
		const from =
			message.transferData.transferredBy && (message.transferData.transferredBy.name || message.transferData.transferredBy.username);
		const transferTypes = {
			agent: (): string =>
				TAPi18n.__(`Livechat_transfer_to_agent${commentLabel}`, {
					from,
					to: message?.transferData?.transferredTo?.name || message?.transferData?.transferredTo?.username || '',
					...(comment && { comment }),
				}),
			department: (): string =>
				TAPi18n.__(`Livechat_transfer_to_department${commentLabel}`, {
					from,
					to: message?.transferData?.nextDepartment?.name || '',
					...(comment && { comment }),
				}),
			queue: (): string =>
				TAPi18n.__('Livechat_transfer_return_to_the_queue', {
					from,
				}),
		};
		return {
			transfer: transferTypes[message.transferData.scope](),
		};
	},
});

MessageTypes.registerType({
	id: 'livechat_transcript_history',
	system: true,
	message: 'Livechat_chat_transcript_sent',
	data(message: IOmnichannelSystemMessage) {
		if (!message.requestData) {
			return {
				transcript: '',
			};
		}

		const { requestData: { type, visitor, user } = { type: 'user' } } = message;
		const requestTypes = {
			visitor: (): string =>
				TAPi18n.__('Livechat_visitor_transcript_request', {
					guest: visitor?.name || visitor?.username || '',
				}),
			user: (): string =>
				TAPi18n.__('Livechat_user_sent_chat_transcript_to_visitor', {
					agent: user?.name || user?.username || '',
					guest: visitor?.name || visitor?.username || '',
				}),
		};

		return {
			transcript: requestTypes[type](),
		};
	},
});

MessageTypes.registerType({
	id: 'livechat_video_call',
	system: true,
	message: 'New_videocall_request',
});

MessageTypes.registerType({
	id: 'livechat_webrtc_video_call',
	render(message) {
		if (message.msg === 'ended' && message.webRtcCallEndTs && message.ts) {
			return TAPi18n.__('WebRTC_call_ended_message', {
				callDuration: formatDistance(new Date(message.webRtcCallEndTs), new Date(message.ts)),
				endTime: moment(message.webRtcCallEndTs).format('h:mm A'),
			});
		}
		if (message.msg === 'declined' && message.webRtcCallEndTs) {
			return TAPi18n.__('WebRTC_call_declined_message');
		}
		return escapeHTML(message.msg);
	},
	message: 'room_changed_privacy',
});

MessageTypes.registerType({
	id: 'omnichannel_placed_chat_on_hold',
	system: true,
	message: 'Omnichannel_placed_chat_on_hold',
	data(message: IOmnichannelSystemMessage) {
		return {
			comment: message.comment ? message.comment : 'No comment provided',
		};
	},
});

MessageTypes.registerType({
	id: 'omnichannel_on_hold_chat_resumed',
	system: true,
	message: 'Omnichannel_on_hold_chat_resumed',
	data(message: IOmnichannelSystemMessage) {
		return {
			comment: message.comment ? message.comment : 'No comment provided',
		};
	},
});
