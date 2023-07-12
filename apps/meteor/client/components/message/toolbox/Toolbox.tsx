import type { IMessage, IRoom, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isThreadMessage, isRoomFederated } from '@rocket.chat/core-typings';
import { MessageToolbox, MessageToolboxItem } from '@rocket.chat/fuselage';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useUser, useSettings, useTranslation, useMethod } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { memo, useMemo } from 'react';

import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useEmojiPickerData } from '../../../contexts/EmojiPickerContext';
import { useMessageActionAppsActionButtons } from '../../../hooks/useAppActionButtons';
import { ui } from '../../../lib/ui';
import EmojiElement from '../../../views/composer/EmojiPicker/EmojiElement';
import { useIsSelecting } from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useAutoTranslate } from '../../../views/room/MessageList/hooks/useAutoTranslate';
import { useChat } from '../../../views/room/contexts/ChatContext';
import { useToolboxContext } from '../../../views/room/contexts/ToolboxContext';
import MessageActionMenu from './MessageActionMenu';

const getMessageContext = (message: IMessage, room: IRoom, context?: MessageActionContext): MessageActionContext => {
	if (context) {
		return context;
	}

	if (message.t === 'videoconf') {
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

type ToolboxProps = {
	message: IMessage & Partial<ITranslatedMessage>;
	messageContext?: MessageActionContext;
	room: IRoom;
	subscription?: ISubscription;
};

const Toolbox = ({ message, messageContext, room, subscription }: ToolboxProps): ReactElement | null => {
	const t = useTranslation();
	const user = useUser();
	const settings = useSettings();

	const quickReactionsEnabled = useFeaturePreview('quickReactions');

	const setReaction = useMethod('setReaction');

	const context = getMessageContext(message, room, messageContext);

	const mapSettings = useMemo(() => Object.fromEntries(settings.map((setting) => [setting._id, setting.value])), [settings]);

	const chat = useChat();
	const { quickReactions, addRecentEmoji } = useEmojiPickerData();

	const actionButtonApps = useMessageActionAppsActionButtons(context);

	const actionsQueryResult = useQuery(['rooms', room._id, 'messages', message._id, 'actions'] as const, async () => {
		const messageActions = await ui.getMessageActions(
			{ message, room, user: user ?? undefined, subscription, settings: mapSettings, chat },
			context,
			'message',
		);
		const menuActions = await ui.getMessageActions(
			{ message, room, user: user ?? undefined, subscription, settings: mapSettings, chat },
			context,
			'menu',
		);

		return { message: messageActions, menu: menuActions };
	});

	const toolbox = useToolboxContext();

	const selecting = useIsSelecting();

	const autoTranslateOptions = useAutoTranslate(subscription);

	if (selecting) {
		return null;
	}

	const isReactionAllowed = actionsQueryResult.data?.message.find(({ id }) => id === 'reaction-message');

	const handleSetReaction = (emoji: string) => {
		setReaction(`:${emoji}:`, message._id);
		addRecentEmoji(emoji);
	};

	return (
		<MessageToolbox>
			{quickReactionsEnabled &&
				isReactionAllowed &&
				quickReactions.slice(0, 3).map(({ emoji, image }) => {
					return <EmojiElement small key={emoji} title={emoji} emoji={emoji} image={image} onClick={() => handleSetReaction(emoji)} />;
				})}
			{actionsQueryResult.isSuccess &&
				actionsQueryResult.data.message.map((action) => (
					<MessageToolboxItem
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
						action: (e): void => action.action(e, { message, tabbar: toolbox, room, chat, autoTranslateOptions }),
					}))}
					data-qa-type='message-action-menu-options'
				/>
			)}
		</MessageToolbox>
	);
};

export default memo(Toolbox);
