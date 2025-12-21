import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';

import type { MessageTypes } from '../MessageTypes';

export default (instance: MessageTypes) => {
	instance.registerType({
		id: 'livechat-started',
		system: true,
		text: (t) => t('Chat_started'),
	});

	instance.registerType({
		id: 'livechat-close',
		system: true,
		text: (t, message) => t('Conversation_closed', { comment: message.msg }),
	});

	instance.registerType({
		id: 'livechat_video_call',
		system: true,
		text: (t) => t('New_videocall_request'),
	});

	instance.registerType({
		id: 'livechat_navigation_history',
		system: true,
		text: (t, message: IOmnichannelSystemMessage) =>
			t('New_visitor_navigation', {
				history: message.navigation
					? `${(message.navigation.page.title ? `${message.navigation.page.title} - ` : '') + message.navigation.page.location.href}`
					: '',
			}),
	});

	instance.registerType({
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
					t('Livechat_transfer_to_agent_auto_transfer_unanswered_chat', {
						from,
						to: message?.transferData?.transferredTo?.name || message?.transferData?.transferredTo?.username || '',
						duration: comment,
					}),
				autoTransferUnansweredChatsToQueue: (): string =>
					t('Livechat_transfer_return_to_the_queue_auto_transfer_unanswered_chat', {
						from,
						duration: comment,
					}),
			};
			return t('New_chat_transfer', { transfer: transferTypes[message.transferData.scope]() });
		},
	});

	instance.registerType({
		id: 'livechat_transfer_history_fallback',
		system: true,
		text: (t, message: any) => {
			if (!message.transferData) {
				return t('New_chat_transfer_fallback', { fallback: 'SHOULD_NEVER_HAPPEN' });
			}
			const from = message.transferData.prevDepartment;
			const to = message.transferData.department.name;

			return t('New_chat_transfer_fallback', { fallback: t('Livechat_transfer_failed_fallback', { from, to }) });
		},
	});

	instance.registerType({
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
};
