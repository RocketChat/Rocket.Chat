import type { IMessage, IUser, IRoom, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isThreadMessage, isRoomFederated } from '@rocket.chat/core-typings';
import { MessageToolbox, MessageToolboxItem } from '@rocket.chat/fuselage';
import { useUser, useUserSubscription, useSettings, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { memo, useMemo } from 'react';

import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useIsSelecting } from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useAutoTranslate } from '../../../views/room/MessageList/hooks/useAutoTranslate';
import { useChat } from '../../../views/room/contexts/ChatContext';
import { useRoom } from '../../../views/room/contexts/RoomContext';
import { useToolboxContext } from '../../../views/room/contexts/ToolboxContext';
import MessageActionMenu from './MessageActionMenu';

const getMessageContext = (message: IMessage, room: IRoom): MessageActionContext => {
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
};

const Toolbox = ({ message }: ToolboxProps): ReactElement | null => {
	const t = useTranslation();

	const room = useRoom();

	const subscription = useUserSubscription(message.rid);
	const settings = useSettings();
	const user = useUser() as IUser;

	const context = getMessageContext(message, room);

	const mapSettings = useMemo(() => Object.fromEntries(settings.map((setting) => [setting._id, setting.value])), [settings]);

	const chat = useChat();

	const actionsQueryResult = useQuery(['rooms', room._id, 'messages', message._id, 'actions'] as const, async () => {
		const messageActions = await MessageAction.getButtons(
			{ message, room, user, subscription, settings: mapSettings, chat },
			context,
			'message',
		);
		const menuActions = await MessageAction.getButtons({ message, room, user, subscription, settings: mapSettings, chat }, context, 'menu');

		return { message: messageActions, menu: menuActions };
	});

	const toolbox = useToolboxContext();

	const selecting = useIsSelecting();

	const autoTranslateOptions = useAutoTranslate(subscription);

	if (selecting) {
		return null;
	}

	return (
		<MessageToolbox>
			{actionsQueryResult.data?.message.map((action) => (
				<MessageToolboxItem
					onClick={(e): void => action.action(e, { message, tabbar: toolbox, room, chat, autoTranslateOptions })}
					key={action.id}
					icon={action.icon}
					title={t(action.label)}
					data-qa-id={action.label}
					data-qa-type='message-action-menu'
				/>
			))}
			{(actionsQueryResult.data?.menu.length ?? 0) > 0 && (
				<MessageActionMenu
					options={
						actionsQueryResult.data?.menu.map((action) => ({
							...action,
							action: (e): void => action.action(e, { message, tabbar: toolbox, room, chat, autoTranslateOptions }),
						})) ?? []
					}
					data-qa-type='message-action-menu-options'
				/>
			)}
		</MessageToolbox>
	);
};

export default memo(Toolbox);
