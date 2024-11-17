import type { IOmnichannelSystemMessage, MessageTypesValues } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import formatDistance from 'date-fns/formatDistance';
import moment from 'moment';

const livechatSystemMessagesMap = new Map<
	MessageTypesValues,
	{
		message: string;
		data?: (message: IOmnichannelSystemMessage, t: (k: string, obj?: Record<string, string>) => string) => Record<string, string>;
	}
>();

const addType = (
	id: MessageTypesValues,
	options: {
		message: string;
		data?: (message: IOmnichannelSystemMessage, t: (k: string, obj?: Record<string, string>) => string) => Record<string, string>;
	},
) => livechatSystemMessagesMap.set(id, options);

export const getSystemMessage = (t: MessageTypesValues) => livechatSystemMessagesMap.get(t);

export const getAllSystemMessagesKeys = () => Array.from(livechatSystemMessagesMap.values()).map((item) => item.message);

addType('livechat-started', { message: 'Chat_started' });

addType('uj', {
	message: 'User_joined_the_channel',
	data(message) {
		return {
			user: message.u.username,
		};
	},
});

addType('livechat_video_call', {
	message: 'New_videocall_request',
});

addType('livechat-close', {
	message: 'Conversation_closed',
	data(message) {
		return {
			comment: message.msg,
		};
	},
});

addType('livechat_navigation_history', {
	message: 'New_visitor_navigation',
	data(message: IOmnichannelSystemMessage) {
		return {
			history: message.navigation
				? `${(message.navigation.page.title ? `${message.navigation.page.title} - ` : '') + message.navigation.page.location.href}`
				: '',
		};
	},
});

addType('livechat_transfer_history', {
	message: 'New_chat_transfer',
	data(message: IOmnichannelSystemMessage, t) {
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
		return {
			transfer: transferTypes[message.transferData.scope](),
		};
	},
});

addType('livechat_transcript_history', {
	message: 'Livechat_chat_transcript_sent',
	data(message: IOmnichannelSystemMessage, t) {
		if (!message.requestData) {
			return {
				transcript: '',
			};
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

		return {
			transcript: requestTypes[type](),
		};
	},
});

addType('livechat_webrtc_video_call', {
	message: 'room_changed_type',
	data(message: IOmnichannelSystemMessage, t) {
		if (message.msg === 'ended' && message.webRtcCallEndTs && message.ts) {
			return {
				message: t('WebRTC_call_ended_message', {
					callDuration: formatDistance(new Date(message.webRtcCallEndTs), new Date(message.ts)),
					endTime: moment(message.webRtcCallEndTs).format('h:mm A'),
				}),
			};
		}
		if (message.msg === 'declined' && message.webRtcCallEndTs) {
			return {
				message: t('WebRTC_call_declined_message'),
			};
		}
		return {
			message: escapeHTML(message.msg),
		};
	},
});

addType('omnichannel_placed_chat_on_hold', {
	message: 'Omnichannel_placed_chat_on_hold',
	data(message: IOmnichannelSystemMessage) {
		return {
			comment: message.comment ? message.comment : 'No comment provided',
		};
	},
});

addType('omnichannel_on_hold_chat_resumed', {
	message: 'Omnichannel_on_hold_chat_resumed',
	data(message: IOmnichannelSystemMessage) {
		return {
			comment: message.comment ? message.comment : 'No comment provided',
		};
	},
});

addType('ul', {
	message: 'User_left_this_channel',
});

addType('omnichannel_priority_change_history', {
	message: 'omnichannel_priority_change_history',
	data(message: IOmnichannelSystemMessage, t): Record<string, string> {
		if (!message.priorityData) {
			return {
				user: t('Unknown_User'),
				priority: t('Without_priority'),
			};
		}
		const {
			definedBy: { username },
			priority: { name = null, i18n } = {},
		} = message.priorityData;

		return {
			user: username || t('Unknown_User'),
			priority: name || (i18n && t(i18n)) || t('Unprioritized'),
		};
	},
});

addType('livechat_transfer_history_fallback', {
	message: 'New_chat_transfer_fallback',
	data(message: any, t) {
		if (!message.transferData) {
			return {
				fallback: 'SHOULD_NEVER_HAPPEN',
			};
		}
		const from = message.transferData.prevDepartment;
		const to = message.transferData.department.name;

		return {
			fallback: t('Livechat_transfer_failed_fallback', { from, to }),
		};
	},
});

addType('omnichannel_sla_change_history', {
	message: 'omnichannel_sla_change_history',
	data(message: IOmnichannelSystemMessage, t): Record<string, string> {
		if (!message.slaData) {
			return {
				user: t('Unknown_User'),
				priority: t('Without_SLA'),
			};
		}
		const {
			definedBy: { username },
			sla: { name = null } = {},
		} = message.slaData;

		return {
			user: username || t('Unknown_User'),
			sla: name || t('Without_SLA'),
		};
	},
});
