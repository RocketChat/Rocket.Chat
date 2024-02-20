import { useToolbar } from '@react-aria/toolbar';
import type { IMessage, IRoom, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isThreadMessage, isRoomFederated, isVideoConfMessage } from '@rocket.chat/core-typings';
import { MessageToolbar as FuselageMessageToolbar, MessageToolbarItem } from '@rocket.chat/fuselage';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useUser, useSettings, useTranslation, useMethod, useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useMemo, useRef } from 'react';

import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useEmojiPickerData } from '../../../contexts/EmojiPickerContext';
import { useMessageActionAppsActionButtons } from '../../../hooks/useAppActionButtons';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import EmojiElement from '../../../views/composer/EmojiPicker/EmojiElement';
import { useIsSelecting } from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useAutoTranslate } from '../../../views/room/MessageList/hooks/useAutoTranslate';
import { useChat } from '../../../views/room/contexts/ChatContext';
import { useRoomToolbox } from '../../../views/room/contexts/RoomToolboxContext';
import MessageActionMenu from './MessageActionMenu';
import { useWebDAVMessageAction } from './useWebDAVMessageAction';

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
	const settings = useSettings();
	const isLayoutEmbedded = useEmbeddedLayout();

	const toolbarRef = useRef(null);
	const { toolbarProps } = useToolbar(props, toolbarRef);

	const quickReactionsEnabled = useFeaturePreview('quickReactions');

	const setReaction = useMethod('setReaction');

	const context = getMessageContext(message, room, messageContext);

	const mapSettings = useMemo(() => Object.fromEntries(settings.map((setting) => [setting._id, setting.value])), [settings]);

	const chat = useChat();
	const { quickReactions, addRecentEmoji } = useEmojiPickerData();

	const actionButtonApps = useMessageActionAppsActionButtons(context);

	const { messageToolbox: hiddenActions } = useLayoutHiddenActions();

	// TODO: move this to another place
	useWebDAVMessageAction();

	const actionsQueryResult = useQuery(['rooms', room._id, 'messages', message._id, 'actions'] as const, async () => {
		const props = { message, room, user, subscription, settings: mapSettings, chat };

		const toolboxItems = await MessageAction.getAll(props, context, 'message');
		const menuItems = await MessageAction.getAll(props, context, 'menu');

		return {
			message: toolboxItems.filter((action) => !hiddenActions.includes(action.id)),
			menu: menuItems.filter((action) => !(isLayoutEmbedded && action.id === 'reply-directly') && !hiddenActions.includes(action.id)),
		};
	});

	const toolbox = useRoomToolbox();

	const selecting = useIsSelecting();

	const autoTranslateOptions = useAutoTranslate(subscription);

	if (selecting || (!actionsQueryResult.data?.message.length && !actionsQueryResult.data?.menu.length)) {
		return null;
	}

	const isReactionAllowed = actionsQueryResult.data?.message.find(({ id }) => id === 'reaction-message');

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
			{actionsQueryResult.isSuccess &&
				actionsQueryResult.data.message.map((action) => (
					<MessageToolbarItem
						onClick={(e): void => action.action(e, { message, tabbar: toolbox, room, chat, autoTranslateOptions })}
						key={action.id}
						icon={action.icon}
						title={t(action.label)}
						data-qa-id={action.label}
						data-qa-type='message-action-menu'
					/>
				))}
			{actionsQueryResult.isSuccess && actionsQueryResult.data.menu.length > 0 && (
				<MessageActionMenu
					options={[...actionsQueryResult.data?.menu, ...(actionButtonApps.data ?? [])].filter(Boolean).map((action) => ({
						...action,
						action: (e) => action.action(e, { message, tabbar: toolbox, room, chat, autoTranslateOptions }),
					}))}
					onChangeMenuVisibility={onChangeMenuVisibility}
					data-qa-type='message-action-menu-options'
				/>
			)}
		</FuselageMessageToolbar>
	);
};

export default memo(MessageToolbar);
