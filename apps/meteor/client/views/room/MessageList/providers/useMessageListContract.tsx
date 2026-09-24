import type { IMessage, IRoom, ITranslatedMessage } from '@rocket.chat/core-typings';
import { usePermission, useRouter, useSetModal, useSetting, useToastMessageDispatch, useUser, useEndpoint } from '@rocket.chat/ui-contexts';
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import CreateDiscussion from '../../../../components/CreateDiscussion';
import { useToggleReactionMutation } from '../../../../components/message/content/reactions/useToggleReactionMutation';
import { getMainMessageText } from '../../../../components/message/helpers/getMainMessageText';
import { useMarkAsUnreadMutation } from '../../../../components/message/hooks/useMarkAsUnreadMutation';
import { usePinMessageMutation } from '../../../../components/message/hooks/usePinMessageMutation';
import { useStarMessageMutation } from '../../../../components/message/hooks/useStarMessageMutation';
import { useUnpinMessageMutation } from '../../../../components/message/hooks/useUnpinMessageMutation';
import { useUnstarMessageMutation } from '../../../../components/message/hooks/useUnstarMessageMutation';
import type { MessageActions, MessageActionsPolicy } from '../../../../components/message/list/messageListContract';
import { EmojiPickerContext } from '../../../../contexts/EmojiPickerContext';
import { AutoTranslate } from '../../../../lib/autotranslate';
import { UiKitTriggerTimeoutError } from '../../../../lib/errors/UiKitTriggerTimeoutError';
import { getPermaLink } from '../../../../lib/getPermaLink';
import { getURL } from '../../../../lib/getURL';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { setMessageJumpQueryStringParameter } from '../../../../lib/utils/setMessageJumpQueryStringParameter';
import { Messages } from '../../../../stores';
import { useUiKitActionManager } from '../../../../uikit/hooks/useUiKitActionManager';
import { useChat } from '../../contexts/ChatContext';
import { useToggleFollowingThreadMutation } from '../../contextualBar/Threads/hooks/useToggleFollowingThreadMutation';
import ForwardMessageModal from '../../modals/ForwardMessageModal';
import PinMessageModal from '../../modals/PinMessageModal';
import ReactionListModal from '../../modals/ReactionListModal';
import ReadReceiptsModal from '../../modals/ReadReceiptsModal';
import ReportMessageModal from '../../modals/ReportMessageModal';
import SaveToWebdavModal from '../../webdav/SaveToWebdavModal';

const noQuickReactions: MessageActionsPolicy['quickReactions'] = [];

/** What the message actions of one room are decided from, read once for its list */
export const useMessageActionsPolicyValue = (room: Pick<IRoom, '_id'>): MessageActionsPolicy => {
	const user = useUser();
	const chat = useChat();
	const quickReactions = useContext(EmojiPickerContext)?.quickReactions ?? noQuickReactions;

	const allowStarring = useSetting('Message_AllowStarring') as boolean | undefined;
	const allowPinning = useSetting('Message_AllowPinning') as boolean | undefined;
	const threadsEnabled = useSetting('Threads_enabled') as boolean | undefined;
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled') as boolean | undefined;
	const webdavEnabled = useSetting('Webdav_Integration_Enabled') as boolean | undefined;
	const allowEditing = useSetting('Message_AllowEditing') as boolean | undefined;
	const blockEditInMinutes = useSetting('Message_AllowEditing_BlockEditInMinutes') as number | undefined;
	const discussionEnabled = useSetting('Discussion_enabled') as boolean | undefined;

	const pinMessage = usePermission('pin-message', room._id);
	const editMessage = usePermission('edit-message', room._id);
	const bypassEditTimeLimit = usePermission('bypass-time-limit-edit-and-delete', room._id);
	const startDiscussion = usePermission('start-discussion', room._id);
	const startDiscussionOtherUser = usePermission('start-discussion-other-user', room._id);
	const autoTranslate = usePermission('auto-translate');
	const createDirectMessage = usePermission('create-d');
	const postReadOnly = usePermission('post-readonly', room._id);

	return useMemo(
		(): MessageActionsPolicy => ({
			user,
			chatAvailable: Boolean(chat),
			quickReactions,
			canDeleteMessage: async (message: IMessage) => (await chat?.data.canDeleteMessage(message)) ?? false,
			settings: {
				allowStarring,
				allowPinning,
				threadsEnabled,
				autoTranslateEnabled,
				webdavEnabled,
				allowEditing,
				blockEditInMinutes,
				discussionEnabled,
			},
			permissions: {
				pinMessage,
				editMessage,
				bypassEditTimeLimit,
				startDiscussion,
				startDiscussionOtherUser,
				autoTranslate,
				createDirectMessage,
				postReadOnly,
			},
		}),
		[
			user,
			chat,
			quickReactions,
			allowStarring,
			allowPinning,
			threadsEnabled,
			autoTranslateEnabled,
			webdavEnabled,
			allowEditing,
			blockEditInMinutes,
			discussionEnabled,
			pinMessage,
			editMessage,
			bypassEditTimeLimit,
			startDiscussion,
			startDiscussionOtherUser,
			autoTranslate,
			createDirectMessage,
			postReadOnly,
		],
	);
};

type AutoTranslateOptions = {
	autoTranslateEnabled: boolean;
	autoTranslateLanguage?: string;
	showAutoTranslate: (message: IMessage) => boolean;
};

/** How each message action is carried out in a room: the modals, toasts and navigation it involves */
export const useMessageActionsValue = (autoTranslateOptions: AutoTranslateOptions): MessageActions => {
	const { t } = useTranslation();
	const chat = useChat();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRouter();
	const actionManager = useUiKitActionManager();
	const addRecentEmoji = useContext(EmojiPickerContext)?.addRecentEmoji;
	const setReaction = useEndpoint('POST', '/v1/chat.react');
	const translateMessage = useEndpoint('POST', '/v1/autotranslate.translateMessage');
	const updateMessages = Messages.use((state) => state.update);

	const { mutateAsync: pinMessage } = usePinMessageMutation();
	const { mutate: unpinMessage } = useUnpinMessageMutation();
	const { mutateAsync: starMessage } = useStarMessageMutation();
	const { mutateAsync: unstarMessage } = useUnstarMessageMutation();
	const { mutateAsync: markAsUnread } = useMarkAsUnreadMutation();
	const { mutate: toggleReaction } = useToggleReactionMutation();
	const { mutate: toggleFollowingThread } = useToggleFollowingThreadMutation({
		onSuccess: (_data, { follow }) => {
			dispatchToastMessage({ type: 'success', message: t(follow ? 'You_followed_this_message' : 'You_unfollowed_this_message') });
		},
	});

	return useMemo((): MessageActions => {
		const closeModal = () => setModal(null);

		const react = (message: IMessage, emoji: string) => {
			setReaction({ emoji: `:${emoji}:`, messageId: message._id });
			addRecentEmoji?.(emoji);
		};

		return {
			pin: (message) => {
				const onConfirm = async () => {
					pinMessage(message);
					setModal(null);
				};
				setModal(<PinMessageModal message={message} onConfirm={onConfirm} onCancel={closeModal} />);
			},
			unpin: (message) => unpinMessage(message),
			star: async (message) => {
				await starMessage(message);
			},
			unstar: async (message) => {
				await unstarMessage(message);
			},
			setFollowing: (message, room, follow) => toggleFollowingThread({ tmid: message.tmid || message._id, follow, rid: room._id }),
			markAsUnread: async (message, subscription) => {
				router.navigate('/home');
				await markAsUnread({ message, subscription });
			},
			toggleTranslation: (message, language, hasTranslations) => {
				if (!hasTranslations) {
					AutoTranslate.messageIdsToWait[message._id] = true;
					updateMessages(
						(record) => record._id === message._id,
						(record) => ({ ...record, autoTranslateFetching: true }),
					);
					void translateMessage({ messageId: message._id, targetLanguage: language });
				}
				updateMessages(
					(record) => record._id === message._id,
					'autoTranslateShowInverse' in message
						? ({ autoTranslateShowInverse: _, ...record }) => record
						: (record) => ({ ...record, autoTranslateShowInverse: true }),
				);
			},
			replyInDirectMessage: (message) => {
				const { msg: _, ...searchParameters } = router.getSearchParameters();
				roomCoordinator.openRouteLink('d', { name: message.u.username }, { ...searchParameters, reply: message._id });
			},
			copyText: async (message) => {
				await navigator.clipboard.writeText(getMainMessageText(message).msg);
				dispatchToastMessage({ type: 'success', message: t('Copied') });
			},
			copyLink: async (message) => {
				try {
					const permalink = await getPermaLink(message._id);
					navigator.clipboard.writeText(permalink);
					dispatchToastMessage({ type: 'success', message: t('Copied') });
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: e });
				}
			},
			edit: async (message) => {
				await chat?.messageEditing.editMessage(message);
			},
			requestDeletion: async (message) => {
				await chat?.flows.requestMessageDeletion(message);
			},
			report: (message) => setModal(<ReportMessageModal message={getMainMessageText(message)} onClose={closeModal} />),
			showReactions: (message) => setModal(<ReactionListModal reactions={message.reactions ?? {}} onClose={closeModal} />),
			showReadReceipts: (message) => setModal(<ReadReceiptsModal messageId={message._id} rid={message.rid} onClose={closeModal} />),
			startDiscussion: (message, room) =>
				setModal(
					<CreateDiscussion
						defaultParentRoom={room?.prid || room?._id}
						onClose={() => setModal(undefined)}
						parentMessageId={message._id}
						nameSuggestion={message?.msg?.substr(0, 140)}
						encryptedParentRoom={room?.encrypted}
					/>,
				),
			saveToWebdav: (message) => {
				const [attachment] = message.attachments || [];
				const url = getURL(attachment.title_link as string, { full: true });
				setModal(<SaveToWebdavModal data={{ attachment, url }} onClose={closeModal} />);
			},
			forward: async (message) => {
				const permalink = await getPermaLink(message._id);
				setModal(<ForwardMessageModal message={message} permalink={permalink} onClose={closeModal} />);
			},
			quote: (message: IMessage & Partial<ITranslatedMessage>) => {
				if (message && autoTranslateOptions.autoTranslateEnabled && autoTranslateOptions.showAutoTranslate(message)) {
					message.msg =
						message.translations && autoTranslateOptions.autoTranslateLanguage
							? message.translations[autoTranslateOptions.autoTranslateLanguage]
							: message.msg;
				}
				chat?.composer?.quoteMessage(message);
			},
			react,
			toggleReaction: (message, reaction) => toggleReaction({ mid: message._id, reaction }),
			openReactionPicker: (message, anchor) => {
				chat?.emojiPicker.open(anchor, (emoji) => react(message, emoji));
			},
			replyInThread: (message) => {
				const routeName = router.getRouteName();
				if (routeName) {
					router.navigate({
						name: routeName,
						params: { ...router.getRouteParameters(), tab: 'thread', context: message.tmid || message._id },
					});
				}
			},
			jumpTo: (message) => {
				void setMessageJumpQueryStringParameter(message._id);
			},
			runAppAction: (action, message) => {
				void actionManager
					.emitInteraction(action.appId, {
						type: 'actionButton',
						rid: message.rid,
						tmid: message.tmid,
						mid: message._id,
						actionId: action.actionId,
						payload: { context: action.context },
					})
					.catch(async (reason) => {
						if (reason instanceof UiKitTriggerTimeoutError) {
							dispatchToastMessage({ type: 'error', message: t('UIKit_Interaction_Timeout') });
							return;
						}
						return reason;
					});
			},
		};
	}, [
		t,
		chat,
		setModal,
		dispatchToastMessage,
		router,
		actionManager,
		addRecentEmoji,
		setReaction,
		translateMessage,
		updateMessages,
		pinMessage,
		unpinMessage,
		starMessage,
		unstarMessage,
		markAsUnread,
		toggleReaction,
		toggleFollowingThread,
		autoTranslateOptions,
	]);
};
