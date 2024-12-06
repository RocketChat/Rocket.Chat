import { useToolbar } from '@react-aria/toolbar';
import type { IMessage, IRoom, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isThreadMessage, isRoomFederated, isVideoConfMessage, isE2EEMessage } from '@rocket.chat/core-typings';
import { MessageToolbar as FuselageMessageToolbar, MessageToolbarItem } from '@rocket.chat/fuselage';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useUser, useTranslation, useMethod, useLayoutHiddenActions, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useRef } from 'react';

import MessageActionMenu from './MessageActionMenu';
import MessageToolbarStarsActionMenu from './MessageToolbarStarsActionMenu';
import { useCopyAction } from './useCopyAction';
import { useDeleteMessageAction } from './useDeleteMessageAction';
import { useEditMessageAction } from './useEditMessageAction';
import { useFollowMessageAction } from './useFollowMessageAction';
import { useForwardMessageAction } from './useForwardMessageAction';
import { useJumpToMessageContextAction } from './useJumpToMessageContextAction';
import { useMarkAsUnreadMessageAction } from './useMarkAsUnreadMessageAction';
import { useNewDiscussionMessageAction } from './useNewDiscussionMessageAction';
import { usePermalinkAction } from './usePermalinkAction';
import { usePinMessageAction } from './usePinMessageAction';
import { useQuoteMessageAction } from './useQuoteMessageAction';
import { useReactionMessageAction } from './useReactionMessageAction';
import { useReadReceiptsDetailsAction } from './useReadReceiptsDetailsAction';
import { useReplyInDMAction } from './useReplyInDMAction';
import { useReplyInThreadMessageAction } from './useReplyInThreadMessageAction';
import { useReportMessageAction } from './useReportMessageAction';
import { useShowMessageReactionsAction } from './useShowMessageReactionsAction';
import { useStarMessageAction } from './useStarMessageAction';
import { useTranslateAction } from './useTranslateAction';
import { useUnFollowMessageAction } from './useUnFollowMessageAction';
import { useUnpinMessageAction } from './useUnpinMessageAction';
import { useUnstarMessageAction } from './useUnstarMessageAction';
import { useViewOriginalTranslationAction } from './useViewOriginalTranslationAction';
import { useWebDAVMessageAction } from './useWebDAVMessageAction';
import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useEmojiPickerData } from '../../../contexts/EmojiPickerContext';
import { useMessageActionAppsActionButtons } from '../../../hooks/useAppActionButtons';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import EmojiElement from '../../../views/composer/EmojiPicker/EmojiElement';
import { useIsSelecting } from '../../../views/room/MessageList/contexts/SelectedMessagesContext';

const getMessageContext = (message: IMessage, room: IRoom, context?: MessageActionContext): MessageActionContext => {
	if (context) {
		return context;
	}

	if (isVideoConfMessage(message)) {
		return 'videoconf';
	}

	if (isRoomFederated(room)) {
		return 'federated';
	}

	if (isThreadMessage(message)) {
		return 'threads';
	}

	return 'message';
};

type MessageToolbarProps = {
	message: IMessage & Partial<ITranslatedMessage>;
	messageContext?: MessageActionContext;
	room: IRoom;
	subscription?: ISubscription;
	onChangeMenuVisibility: (visible: boolean) => void;
} & ComponentProps<typeof FuselageMessageToolbar>;

const MessageToolbar = ({
	message,
	messageContext,
	room,
	subscription,
	onChangeMenuVisibility,
	...props
}: MessageToolbarProps): ReactElement | null => {
	const t = useTranslation();
	const user = useUser() ?? undefined;
	const isLayoutEmbedded = useEmbeddedLayout();

	const toolbarRef = useRef(null);
	const { toolbarProps } = useToolbar(props, toolbarRef);

	const quickReactionsEnabled = useFeaturePreview('quickReactions');

	const setReaction = useMethod('setReaction');

	const context = getMessageContext(message, room, messageContext);

	const { quickReactions, addRecentEmoji } = useEmojiPickerData();

	const actionButtonApps = useMessageActionAppsActionButtons(message, context);

	const starsAction = useMessageActionAppsActionButtons(message, context, 'ai');

	const { messageToolbox: hiddenActions } = useLayoutHiddenActions();
	const allowStarring = useSetting('Message_AllowStarring');

	// TODO: move this to another place
	useWebDAVMessageAction(message, { subscription });
	useNewDiscussionMessageAction(message, { user, room, subscription });
	useUnpinMessageAction(message, { room, subscription });
	usePinMessageAction(message, { room, subscription });
	useStarMessageAction(message, { room, user });
	useUnstarMessageAction(message, { room, user });
	usePermalinkAction(message, { subscription, id: 'permalink-star', context: ['starred'], order: 10 });
	usePermalinkAction(message, { subscription, id: 'permalink-pinned', context: ['pinned'], order: 5 });
	usePermalinkAction(message, {
		subscription,
		id: 'permalink',
		context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		type: 'duplication',
		order: 5,
	});
	useFollowMessageAction(message, { room, user, context });
	useUnFollowMessageAction(message, { room, user, context });
	useReplyInThreadMessageAction(message, { room, subscription });
	useJumpToMessageContextAction(message, {
		id: 'jump-to-message',
		order: 100,
		context: ['mentions', 'threads', 'videoconf-threads', 'message-mobile', 'search'],
	});
	useJumpToMessageContextAction(message, {
		id: 'jump-to-pin-message',
		order: 100,
		hidden: !subscription,
		context: ['pinned', 'direct'],
	});
	useJumpToMessageContextAction(message, {
		id: 'jump-to-star-message',
		hidden: !allowStarring || !subscription,
		order: 100,
		context: ['starred'],
	});
	useReactionMessageAction(message, { user, room, subscription });
	useMarkAsUnreadMessageAction(message, { user, room, subscription });
	useTranslateAction(message, { user, room, subscription });
	useViewOriginalTranslationAction(message, { user, room, subscription });
	useReplyInDMAction(message, { user, room, subscription });
	useForwardMessageAction(message);
	useQuoteMessageAction(message, { subscription });
	useCopyAction(message, { subscription });
	useEditMessageAction(message, { user, room, subscription });
	useDeleteMessageAction(message, { user, room, subscription });
	useReportMessageAction(message, { user, room, subscription });
	useShowMessageReactionsAction(message);
	useReadReceiptsDetailsAction(message);

	const { isSuccess, data } = useQuery({
		queryKey: roomsQueryKeys.messageActionsWithParameters(room._id, message),
		queryFn: async () => {
			const toolboxItems = await MessageAction.getAll(context, 'message');
			const menuItems = await MessageAction.getAll(context, 'menu');

			return {
				message: toolboxItems.filter((action) => !hiddenActions.includes(action.id)),
				menu: menuItems.filter((action) => !(isLayoutEmbedded && action.id === 'reply-directly') && !hiddenActions.includes(action.id)),
			};
		},
		keepPreviousData: true,
	});

	const selecting = useIsSelecting();

	if (selecting || (!data?.message.length && !data?.menu.length)) {
		return null;
	}

	const isReactionAllowed = data?.message.find(({ id }) => id === 'reaction-message');

	const handleSetReaction = (emoji: string) => {
		setReaction(`:${emoji}:`, message._id);
		addRecentEmoji(emoji);
	};

	return (
		<FuselageMessageToolbar ref={toolbarRef} {...toolbarProps} aria-label={t('Message_actions')} {...props}>
			{quickReactionsEnabled &&
				isReactionAllowed &&
				quickReactions.slice(0, 3).map(({ emoji, image }) => {
					return <EmojiElement small key={emoji} title={emoji} emoji={emoji} image={image} onClick={() => handleSetReaction(emoji)} />;
				})}
			{isSuccess &&
				data.message.map((action) => (
					<MessageToolbarItem
						onClick={(e): void => action.action(e)}
						key={action.id}
						icon={action.icon}
						title={action?.disabled ? t('Action_not_available_encrypted_content', { action: t(action.label) }) : t(action.label)}
						data-qa-id={action.label}
						data-qa-type='message-action-menu'
						disabled={action?.disabled}
					/>
				))}
			{starsAction.data && starsAction.data.length > 0 && (
				<MessageToolbarStarsActionMenu
					options={starsAction.data.map((action) => ({
						...action,
						action: (e) => action.action(e),
					}))}
					onChangeMenuVisibility={onChangeMenuVisibility}
					data-qa-type='message-action-stars-menu-options'
					isMessageEncrypted={isE2EEMessage(message)}
				/>
			)}

			{isSuccess && data.menu.length > 0 && (
				<MessageActionMenu
					options={[...data?.menu, ...(actionButtonApps.data ?? [])].filter(Boolean).map((action) => ({
						...action,
						action: (e) => action.action(e),
					}))}
					onChangeMenuVisibility={onChangeMenuVisibility}
					data-qa-type='message-action-menu-options'
					isMessageEncrypted={isE2EEMessage(message)}
				/>
			)}
		</FuselageMessageToolbar>
	);
};

export default memo(MessageToolbar);
