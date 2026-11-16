import type { IMessage, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useSetModal, useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import type { MessageInteractionsContextValue } from '@rocket.chat/ui-message-list';
import { useMemo } from 'react';

import { useMarkAsUnreadMutation } from './actions/useMarkAsUnreadMutation';
import { usePinMessageMutation } from './actions/usePinMessageMutation';
import { useStarMessageMutation } from './actions/useStarMessageMutation';
import { useToggleReactionMutation } from './actions/useToggleReactionMutation';
import { useUnpinMessageMutation } from './actions/useUnpinMessageMutation';
import { useUnstarMessageMutation } from './actions/useUnstarMessageMutation';
import CreateDiscussion from '../../components/CreateDiscussion';
import { useAutoTranslate } from '../../hooks/useAutoTranslate';
import { AutoTranslate } from '../../lib/autotranslate';
import type { ChatAPI } from '../../lib/chats/ChatAPI';
import { getPermaLink } from '../../lib/getPermaLink';
import { Messages, Rooms, Subscriptions } from '../../stores';
import { useToggleFollowingThreadMutation } from '../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';
import ForwardMessageModal from '../../views/room/modals/ForwardMessageModal';
import ReactionListModal from '../../views/room/modals/ReactionListModal';
import ReadReceiptsModal from '../../views/room/modals/ReadReceiptsModal';
import ReportMessageModal from '../../views/room/modals/ReportMessageModal';

const findSubscription = (rid: IMessage['rid']): ISubscription | undefined => Subscriptions.state.find((record) => record.rid === rid);

const withMainText = (message: IMessage): IMessage => ({
	...message,
	msg: message.msg || message.attachments?.[0]?.description || message.attachments?.[0]?.title || '',
	md: message.md || message.attachments?.[0]?.descriptionMd || undefined,
});

/**
 * What the viewer does to a message, carried out through the chat of the conversation, its modals and the REST API. The
 * composer is reached only where a chat is open.
 */
export const useMessageInteractionsValue = (
	chat: ChatAPI | undefined,
	subscription: ISubscription | undefined,
): MessageInteractionsContextValue => {
	const user = useUser();
	const username = user?.username;
	const setModal = useSetModal();
	const translateMessage = useEndpoint('POST', '/v1/autotranslate.translateMessage');
	const { mutate: toggleReaction } = useToggleReactionMutation();
	const { mutate: pinMessage } = usePinMessageMutation();
	const { mutate: unpinMessage } = useUnpinMessageMutation();
	const { mutate: starMessage } = useStarMessageMutation();
	const { mutate: unstarMessage } = useUnstarMessageMutation();
	const { mutate: markAsUnread } = useMarkAsUnreadMutation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { mutate: toggleFollowingThread } = useToggleFollowingThreadMutation({
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
	const { autoTranslateEnabled, autoTranslateLanguage, showAutoTranslate } = useAutoTranslate(subscription);

	return useMemo(() => {
		const closeModal = () => setModal(null);
		const updateMessage = (messageId: IMessage['_id'], update: (record: IMessage) => IMessage) =>
			Messages.state.update((record) => record._id === messageId, update);

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
			edit: (message) => {
				void chat?.messageEditing.editMessage(message);
			},
			canDelete: () => !!chat,
			requestDeletion: (message) => {
				void chat?.flows.requestMessageDeletion(message);
			},
			replyBroadcast: (message) => {
				void chat?.flows.replyBroadcast(message);
			},
			pin: (message) => pinMessage(message),
			unpin: (message) => unpinMessage(message),
			star: (message) => starMessage(message),
			unstar: (message) => unstarMessage(message),
			followThread: (message) => toggleFollowingThread({ rid: message.rid, tmid: message._id, follow: true }),
			unfollowThread: (message) => toggleFollowingThread({ rid: message.rid, tmid: message._id, follow: false }),
			markUnread: (message) => {
				const subscription = findSubscription(message.rid);
				if (subscription) {
					markAsUnread({ message, subscription });
				}
			},
			translate: (message) => {
				const language = findSubscription(message.rid)?.autoTranslateLanguage || AutoTranslate.getLanguage(message.rid);
				AutoTranslate.messageIdsToWait[message._id] = true;
				updateMessage(message._id, (record) => ({ ...record, autoTranslateFetching: true, autoTranslateShowInverse: true }));
				void translateMessage({ messageId: message._id, targetLanguage: language });
			},
			showOriginal: (message) => {
				updateMessage(
					message._id,
					({ autoTranslateShowInverse: _, ...record }: IMessage & { autoTranslateShowInverse?: boolean }) => record,
				);
			},
			openForward: async (message) => {
				const permalink = await getPermaLink(message._id);
				setModal(<ForwardMessageModal message={message} permalink={permalink} onClose={closeModal} />);
			},
			openReport: (message) => {
				setModal(<ReportMessageModal message={withMainText(message)} onClose={closeModal} />);
			},
			openReactionList: (message) => {
				setModal(<ReactionListModal reactions={message.reactions ?? {}} onClose={closeModal} />);
			},
			openReadReceipts: (message) => {
				setModal(<ReadReceiptsModal messageId={message._id} rid={message.rid} onClose={closeModal} />);
			},
			startDiscussion: (message) => {
				const room = Rooms.state.get(message.rid);
				setModal(
					<CreateDiscussion
						defaultParentRoom={room?.prid || message.rid}
						onClose={closeModal}
						parentMessageId={message._id}
						nameSuggestion={message.msg?.substring(0, 140)}
						encryptedParentRoom={room?.encrypted}
					/>,
				);
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
		translateMessage,
		pinMessage,
		unpinMessage,
		starMessage,
		unstarMessage,
		markAsUnread,
		toggleFollowingThread,
	]);
};
