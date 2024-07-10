import type { MessageTypesValues } from '@rocket.chat/core-typings';

import type { PDFMessage } from './templates/ChatTranscript';

const livechatSystemMessagesMap = new Map<
	MessageTypesValues,
	{
		message: string;
		data?: (message: PDFMessage, t: (k: string, obj: Record<string, string>) => Promise<string>) => Promise<Record<string, string>>;
	}
>();

const addType = (
	id: MessageTypesValues,
	options: {
		message: string;
		data?: (message: PDFMessage, t: (k: string, obj: Record<string, string>) => Promise<string>) => Promise<Record<string, string>>;
	},
) => livechatSystemMessagesMap.set(id, options);

console.log('Adding Message Types');

export const getSystemMessage = (t: MessageTypesValues) => livechatSystemMessagesMap.get(t);

addType('livechat-started', { message: 'Chat_started' });

addType('uj', {
	message: 'User_joined_the_channel',
	async data(message) {
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
	async data(message) {
		return {
			comment: message.msg,
		};
	},
});

addType('livechat_navigation_history', {
	message: 'New_visitor_navigation',
	async data(message: PDFMessage) {
		return {
			history: message.navigation
				? `${(message.navigation.page.title ? `${message.navigation.page.title} - ` : '') + message.navigation.page.location.href}`
				: '',
		};
	},
});

addType('livechat_transfer_history', {
	message: 'New_chat_transfer',
	async data(message: PDFMessage, t) {
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
			agent: (): Promise<string> =>
				t(`Livechat_transfer_to_agent${commentLabel}`, {
					from,
					to: message?.transferData?.transferredTo?.name || message?.transferData?.transferredTo?.username || '',
					...(comment && { comment }),
				}),
			department: (): Promise<string> =>
				t(`Livechat_transfer_to_department${commentLabel}`, {
					from,
					to: message?.transferData?.nextDepartment?.name || '',
					...(comment && { comment }),
				}),
			queue: (): Promise<string> =>
				t(`Livechat_transfer_return_to_the_queue${commentLabel}`, {
					from,
					...(comment && { comment }),
				}),
			autoTransferUnansweredChatsToAgent: (): Promise<string> =>
				t(`Livechat_transfer_to_agent_auto_transfer_unanswered_chat`, {
					from,
					to: message?.transferData?.transferredTo?.name || message?.transferData?.transferredTo?.username || '',
					duration: comment,
				}),
			autoTransferUnansweredChatsToQueue: (): Promise<string> =>
				t(`Livechat_transfer_return_to_the_queue_auto_transfer_unanswered_chat`, {
					from,
					duration: comment,
				}),
		};
		return {
			transfer: await transferTypes[message.transferData.scope](),
		};
	},
});
