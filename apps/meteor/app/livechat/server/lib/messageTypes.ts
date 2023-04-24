import formatDistance from 'date-fns/formatDistance';
import moment from 'moment';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { Translation } from '@rocket.chat/core-services';

import { MessageTypes } from '../../../ui-utils/server';

const translateToServerLanguageFn = await Translation.getTranslateToServerLanguageFnWrapper();

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
				translateToServerLanguageFn(`Livechat_transfer_to_agent${commentLabel}`, {
					interpolate: {
						from,
						to: message?.transferData?.transferredTo?.name || message?.transferData?.transferredTo?.username || '',
						...(comment && { comment }),
					},
				}),
			department: (): string =>
				translateToServerLanguageFn(`Livechat_transfer_to_department${commentLabel}`, {
					interpolate: {
						from,
						to: message?.transferData?.nextDepartment?.name || '',
						...(comment && { comment }),
					},
				}),
			queue: (): string =>
				translateToServerLanguageFn(`Livechat_transfer_return_to_the_queue${commentLabel}`, {
					interpolate: {
						from,
						...(comment && { comment }),
					},
				}),
			autoTransferUnansweredChatsToAgent: (): string =>
				translateToServerLanguageFn(`Livechat_transfer_to_agent_auto_transfer_unanswered_chat`, {
					interpolate: {
						from,
						to: message?.transferData?.transferredTo?.name || message?.transferData?.transferredTo?.username || '',
						duration: comment,
					},
				}),
			autoTransferUnansweredChatsToQueue: (): string =>
				translateToServerLanguageFn(`Livechat_transfer_return_to_the_queue_auto_transfer_unanswered_chat`, {
					interpolate: {
						from,
						duration: comment,
					},
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
				translateToServerLanguageFn('Livechat_visitor_transcript_request', {
					interpolate: {
						guest: visitor?.name || visitor?.username || '',
					},
				}),
			user: (): string =>
				translateToServerLanguageFn('Livechat_user_sent_chat_transcript_to_visitor', {
					interpolate: {
						agent: user?.name || user?.username || '',
						guest: visitor?.name || visitor?.username || '',
					},
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
			return translateToServerLanguageFn('WebRTC_call_ended_message', {
				interpolate: {
					callDuration: formatDistance(new Date(message.webRtcCallEndTs), new Date(message.ts)),
					endTime: moment(message.webRtcCallEndTs).format('h:mm A'),
				},
			});
		}
		if (message.msg === 'declined' && message.webRtcCallEndTs) {
			return translateToServerLanguageFn('WebRTC_call_declined_message');
		}
		return escapeHTML(message.msg);
	},
	message: 'room_changed_type',
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
