import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { formatDistance } from 'date-fns';
import moment from 'moment';

MessageTypes.registerType({
	id: 'livechat_navigation_history',
	system: true,
	text: (t, message: IOmnichannelSystemMessage) => {
		return t('New_visitor_navigation', {
			history: message.navigation
				? `${(message.navigation.page.title ? `${message.navigation.page.title} - ` : '') + message.navigation.page.location.href}`
				: '',
		});
	},
});

MessageTypes.registerType({
	id: 'livechat_transfer_history',
	system: true,
	text: (t, message: IOmnichannelSystemMessage) => {
		if (!message.transferData) {
			return t('New_chat_transfer', { transfer: '' });
		}

		const { comment } = message.transferData;
		const commentLabel = comment && comment !== '' ? '_with_a_comment' : '';
		const from =
			message.transferData.transferredBy && (message.transferData.transferredBy.name || message.transferData.transferredBy.username);
		const transferTypes = {
			agent: (): string =>
				t(`Livechat_transfer_to_agent${commentLabel}`, {
					from,
					to: message?.transferData?.transferredTo?.name || message?.transferData?.transferredTo?.username || '',
					...(comment && { comment }),
				}),
			department: (): string =>
				t(`Livechat_transfer_to_department${commentLabel}`, {
					from,
					to: message?.transferData?.nextDepartment?.name || '',
					...(comment && { comment }),
				}),
			queue: (): string =>
				t(`Livechat_transfer_return_to_the_queue${commentLabel}`, {
					from,
					...(comment && { comment }),
				}),
			autoTransferUnansweredChatsToAgent: (): string =>
				t(`Livechat_transfer_to_agent_auto_transfer_unanswered_chat`, {
					from,
					to: message?.transferData?.transferredTo?.name || message?.transferData?.transferredTo?.username || '',
					duration: comment,
				}),
			autoTransferUnansweredChatsToQueue: (): string =>
				t(`Livechat_transfer_return_to_the_queue_auto_transfer_unanswered_chat`, {
					from,
					duration: comment,
				}),
		};
		return t('New_chat_transfer', { transfer: transferTypes[message.transferData.scope]() });
	},
});

MessageTypes.registerType({
	id: 'livechat_transcript_history',
	system: true,
	text: (t, message: IOmnichannelSystemMessage) => {
		if (!message.requestData) {
			return t('Livechat_chat_transcript_sent', { transcript: '' });
		}

		const { requestData: { type, visitor, user } = { type: 'user' } } = message;
		const requestTypes = {
			visitor: (): string =>
				t('Livechat_visitor_transcript_request', {
					guest: visitor?.name || visitor?.username || '',
				}),
			user: (): string =>
				t('Livechat_user_sent_chat_transcript_to_visitor', {
					agent: user?.name || user?.username || '',
					guest: visitor?.name || visitor?.username || '',
				}),
		};

		return t('Livechat_chat_transcript_sent', { transcript: requestTypes[type]() });
	},
});

MessageTypes.registerType({
	id: 'livechat_video_call',
	system: true,
	text: (t) => t('New_videocall_request'),
});

MessageTypes.registerType({
	id: 'livechat_webrtc_video_call',
	system: false,
	text: (t, message) => {
		if (message.msg === 'ended' && message.webRtcCallEndTs && message.ts) {
			return t('room_changed_type', {
				message: t('WebRTC_call_ended_message', {
					callDuration: formatDistance(new Date(message.webRtcCallEndTs), new Date(message.ts)),
					endTime: moment(message.webRtcCallEndTs).format('h:mm A'),
				}),
			});
		}
		if (message.msg === 'declined' && message.webRtcCallEndTs) {
			return t('room_changed_type', {
				message: t('WebRTC_call_declined_message'),
			});
		}
		return t('room_changed_type', {
			message: message.msg,
		});
	},
});

MessageTypes.registerType({
	id: 'omnichannel_placed_chat_on_hold',
	system: true,
	text: (t, message: IOmnichannelSystemMessage) =>
		t('Omnichannel_placed_chat_on_hold', { comment: message.comment ? message.comment : 'No comment provided' }),
});

MessageTypes.registerType({
	id: 'omnichannel_on_hold_chat_resumed',
	system: true,
	text: (t, message: IOmnichannelSystemMessage) =>
		t('Omnichannel_on_hold_chat_resumed', { comment: message.comment ? message.comment : 'No comment provided' }),
});
