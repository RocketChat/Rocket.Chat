import type { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { KonchatNotification } from '../../../../app/ui/client/lib/KonchatNotification';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { t } from '../../../../app/utils/lib/i18n';
import AIContentSuggestionsModal from '../../../components/AIContentSuggestionsModal';
import { imperativeModal } from '../../imperativeModal';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';
import { processMessageEditing } from './processMessageEditing';
import { processSetReaction } from './processSetReaction';
import { processSlashCommand } from './processSlashCommand';
import { processTooLongMessage } from './processTooLongMessage';

const isAIContentError = (error: unknown): boolean => {
	return typeof error === 'object' && error !== null && 'error' in error && (error as { error: string }).error === 'message-blocked-by-ai';
};

const showAISuggestionsModal = (
	chat: ChatAPI,
	{ error, originalMessage, previewUrls }: { error: unknown; originalMessage: string; previewUrls?: string[] },
): void => {
	const suggestions = (error as { details: { suggestions: string[] } }).details?.suggestions || [];
	const reason = (error as { reason: string }).reason || 'Message blocked by AI content verification';

	if (suggestions.length === 0) {
		dispatchToastMessage({ type: 'error', message: reason });
		return;
	}

	(async () => {
		try {
			const { ChatMessage } = await import('../../../../app/models/client');
			const roomId = await chat.data.getRoom().then((room) => room._id);
			const userId = Meteor.userId();

			if (roomId && userId) {
				const tempMessages = ChatMessage.find({
					'rid': roomId,
					'temp': true,
					'u._id': userId,
					'msg': originalMessage,
				}).fetch();

				tempMessages.forEach((msg) => {
					ChatMessage.remove({ _id: msg._id });
				});
			}
		} catch (cleanupError) {
			// ignore cleanup errors silently
		}
	})();

	const modalInstance = imperativeModal.open({
		component: AIContentSuggestionsModal,
		props: {
			suggestions,
			originalMessage,
			reason,
			onClose: () => {
				chat.composer?.setText(originalMessage);
				modalInstance.close();
			},
			onSelectSuggestion: async (selectedSuggestion: string) => {
				chat.composer?.setText(selectedSuggestion);
				const message = await chat.data.composeMessage(selectedSuggestion, {
					sendToChannel: false,
					quotedMessages: chat.composer?.quotedMessages.get() ?? [],
					originalMessage: null,
				});
				try {
					await process(chat, message, previewUrls);
					chat.composer?.dismissAllQuotedMessages();
					chat.composer?.setText('');
					try {
						const { ChatMessage } = await import('../../../../app/models/client');
						if (message.rid && message.u?._id) {
							const tempMessages = ChatMessage.find({
								'rid': message.rid,
								'temp': true,
								'u._id': message.u._id,
							}).fetch();

							const tempMessage = tempMessages.find((msg) => msg.msg === originalMessage);

							if (tempMessage?._id) {
								ChatMessage.remove({ _id: tempMessage._id });
							} else {
								tempMessages.forEach((msg) => {
									ChatMessage.remove({ _id: msg._id });
								});
							}
						}
					} catch (cleanupError) {
						// ignore cleanup errors silently
					}
				} catch (retryError) {
					dispatchToastMessage({ type: 'error', message: retryError });
				}
			},
		},
	});
};

const process = async (chat: ChatAPI, message: IMessage, previewUrls?: string[]): Promise<void> => {
	KonchatNotification.removeRoomNotification(message.rid);

	if (await processSetReaction(chat, message)) {
		return;
	}

	if (await processTooLongMessage(chat, message)) {
		return;
	}

	if (await processMessageEditing(chat, message, previewUrls)) {
		return;
	}

	if (await processSlashCommand(chat, message)) {
		return;
	}

	await sdk.call('sendMessage', message, previewUrls);
};

export const sendMessage = async (
	chat: ChatAPI,
	{ text, tshow, previewUrls }: { text: string; tshow?: boolean; previewUrls?: string[] },
): Promise<boolean> => {
	if (!(await chat.data.isSubscribedToRoom())) {
		try {
			await chat.data.joinRoom();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return false;
		}
	}

	chat.readStateManager.clearUnreadMark();
	await chat.readStateManager.debouncedMarkAsRead();

	text = text.trim();

	if (!text && !chat.currentEditing) {
		// Nothing to do
		return false;
	}

	if (text) {
		const message = await chat.data.composeMessage(text, {
			sendToChannel: tshow,
			quotedMessages: chat.composer?.quotedMessages.get() ?? [],
			originalMessage: chat.currentEditing ? await chat.data.findMessageByID(chat.currentEditing.mid) : null,
		});

		try {
			await process(chat, message, previewUrls);
			chat.composer?.dismissAllQuotedMessages();
		} catch (error) {
			if (isAIContentError(error)) {
				showAISuggestionsModal(chat, { error, originalMessage: text, previewUrls });
			} else {
				dispatchToastMessage({ type: 'error', message: error });
			}
		}
		return true;
	}

	if (chat.currentEditing) {
		const originalMessage = await chat.data.findMessageByID(chat.currentEditing.mid);

		if (!originalMessage) {
			dispatchToastMessage({ type: 'warning', message: t('Message_not_found') });
			return false;
		}

		try {
			if (await chat.flows.processMessageEditing({ ...originalMessage, msg: '' }, previewUrls)) {
				chat.currentEditing.stop();
				return false;
			}

			await chat.currentEditing?.reset();
			await chat.flows.requestMessageDeletion(originalMessage);
			return false;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}

	return false;
};
