import type { IMessage, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { useSetModal, useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import type { MessageInteractionsContextValue } from '@rocket.chat/ui-message-list';
import { useMemo } from 'react';

import { useToggleReactionMutation } from './actions/useToggleReactionMutation';
import { useAutoTranslate } from '../../hooks/useAutoTranslate';
import type { ChatAPI } from '../../lib/chats/ChatAPI';
import { getPermaLink } from '../../lib/getPermaLink';
import { useToggleFollowingThreadMutation } from '../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';
import ForwardMessageModal from '../../views/room/modals/ForwardMessageModal';

/**
 * What the message components ask the viewer's app to do to a message: react, quote, reply, follow its thread and forward it, carried
 * out through the chat of the conversation, its modals and the REST API. The composer is reached only where a chat is open.
 */
export const useMessageInteractionsValue = (
	chat: ChatAPI | undefined,
	subscription: ISubscription | undefined,
): MessageInteractionsContextValue => {
	const user = useUser();
	const username = user?.username;
	const setModal = useSetModal();
	const { mutate: toggleReaction } = useToggleReactionMutation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { mutate: toggleFollowingThread } = useToggleFollowingThreadMutation({
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
	const { autoTranslateEnabled, autoTranslateLanguage, showAutoTranslate } = useAutoTranslate(subscription);

	return useMemo(() => {
		const closeModal = () => setModal(null);

		const react = (message: IMessage, reaction: string) => {
			toggleReaction({ mid: message._id, reaction });
		};

		return {
			toggleReaction: react,
			hasReacted: (message, reaction) => !!username && !!message.reactions?.[reaction]?.usernames.includes(username),
			openReactionPicker: (event, message, { onClose } = {}) => {
				event.nativeEvent.stopImmediatePropagation();
				if (!user || !chat) {
					// Whoever asked to hold something open while the picker is must not wait for one that never opened.
					onClose?.();
					return;
				}
				chat.emojiPicker.open(event.currentTarget, (emoji) => react(message, `:${emoji}:`), onClose);
			},
			quote: (message: IMessage & Partial<ITranslatedMessage>) => {
				const isTranslated = autoTranslateEnabled && autoTranslateLanguage && showAutoTranslate(message);
				const msg = isTranslated ? (message.translations?.[autoTranslateLanguage] ?? message.msg) : message.msg;
				void chat?.composer?.quoteMessage({ ...message, msg });
			},
			quoteMessageById: async (messageId) => {
				if (!chat) {
					return;
				}
				await chat.composer?.quoteMessage(await chat.data.getMessageByID(messageId));
			},
			replyWith: async (text) => {
				await chat?.composer?.replyWith(text);
			},
			sendMessage: async (text) => {
				await chat?.flows.sendMessage({ text });
			},
			replyBroadcast: (message) => {
				void chat?.flows.replyBroadcast(message);
			},
			followThread: (message) => toggleFollowingThread({ rid: message.rid, tmid: message._id, follow: true }),
			unfollowThread: (message) => toggleFollowingThread({ rid: message.rid, tmid: message._id, follow: false }),
			openForward: async (message) => {
				const permalink = await getPermaLink(message._id);
				setModal(<ForwardMessageModal message={message} permalink={permalink} onClose={closeModal} />);
			},
		};
	}, [
		chat,
		user,
		username,
		autoTranslateEnabled,
		autoTranslateLanguage,
		showAutoTranslate,
		setModal,
		toggleReaction,
		toggleFollowingThread,
	]);
};
