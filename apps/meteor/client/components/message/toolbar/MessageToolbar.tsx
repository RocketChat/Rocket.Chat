import { useToolbar } from '@react-aria/toolbar';
import type { IMessage, IRoom, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isThreadMessage, isRoomFederated, isVideoConfMessage, isE2EEMessage } from '@rocket.chat/core-typings';
import { MessageToolbar as FuselageMessageToolbar } from '@rocket.chat/fuselage';
import { useUser, useTranslation, useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ElementType, ReactElement } from 'react';
import React, { memo, useRef } from 'react';

import MessageActionMenu from './MessageActionMenu';
import MessageToolbarStarsActionMenu from './MessageToolbarStarsActionMenu';
import DefaultItems from './items/DefaultItems';
import DirectItems from './items/DirectItems';
import FederatedItems from './items/FederatedItems';
import MentionsItems from './items/MentionsItems';
import MobileItems from './items/MobileItems';
import PinnedItems from './items/PinnedItems';
import SearchItems from './items/SearchItems';
import StarredItems from './items/StarredItems';
import ThreadsItems from './items/ThreadsItems';
import VideoconfItems from './items/VideoconfItems';
import VideoconfThreadsItems from './items/VideoconfThreadsItems';
import { useCopyAction } from './useCopyAction';
import { useDeleteMessageAction } from './useDeleteMessageAction';
import { useEditMessageAction } from './useEditMessageAction';
import { useFollowMessageAction } from './useFollowMessageAction';
import { useMarkAsUnreadMessageAction } from './useMarkAsUnreadMessageAction';
import { useNewDiscussionMessageAction } from './useNewDiscussionMessageAction';
import { usePermalinkAction } from './usePermalinkAction';
import { usePinMessageAction } from './usePinMessageAction';
import { useReadReceiptsDetailsAction } from './useReadReceiptsDetailsAction';
import { useReplyInDMAction } from './useReplyInDMAction';
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
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import { useMessageActionAppsActionButtons } from '../../../hooks/useMessageActionAppsActionButtons';
import { roomsQueryKeys } from '../../../lib/queryKeys';

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

const itemsByContext: Record<
	MessageActionContext,
	ElementType<{ message: IMessage; room: IRoom; subscription: ISubscription | undefined }>
> = {
	'message': DefaultItems,
	'message-mobile': MobileItems,
	'threads': ThreadsItems,
	'videoconf': VideoconfItems,
	'videoconf-threads': VideoconfThreadsItems,
	'pinned': PinnedItems,
	'direct': DirectItems,
	'starred': StarredItems,
	'mentions': MentionsItems,
	'federated': FederatedItems,
	'search': SearchItems,
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

	const context = getMessageContext(message, room, messageContext);

	const actionButtonApps = useMessageActionAppsActionButtons(message, context);

	const starsAction = useMessageActionAppsActionButtons(message, context, 'ai');

	const hiddenActions = useLayoutHiddenActions().messageToolbox;

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
	useMarkAsUnreadMessageAction(message, { user, room, subscription });
	useTranslateAction(message, { user, room, subscription });
	useViewOriginalTranslationAction(message, { user, room, subscription });
	useReplyInDMAction(message, { user, room, subscription });
	useCopyAction(message, { subscription });
	useEditMessageAction(message, { user, room, subscription });
	useDeleteMessageAction(message, { user, room, subscription });
	useReportMessageAction(message, { user, room, subscription });
	useShowMessageReactionsAction(message);
	useReadReceiptsDetailsAction(message);

	const { isSuccess, data } = useQuery({
		queryKey: roomsQueryKeys.messageActionsWithParameters(room._id, message),
		queryFn: async () => {
			const menuItems = await MessageAction.getAll(context, 'menu');

			return {
				menu: menuItems.filter((action) => !(isLayoutEmbedded && action.id === 'reply-directly') && !hiddenActions.includes(action.id)),
			};
		},
		keepPreviousData: true,
	});

	if (!data?.menu.length) {
		return null;
	}

	const Items = itemsByContext[context];

	return (
		<FuselageMessageToolbar ref={toolbarRef} {...toolbarProps} aria-label={t('Message_actions')} {...props}>
			<Items message={message} room={room} subscription={subscription} />
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
