import type { IMessage, IUser, IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { MessageToolbox, MessageToolboxItem } from '@rocket.chat/fuselage';
import { useUser, useUserSubscription, useSettings, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo, useMemo } from 'react';

import type { MessageActionContext } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { MessageAction } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { useChat } from '../../../contexts/ChatContext';
import { useRoom } from '../../../contexts/RoomContext';
import { useToolboxContext } from '../../../contexts/ToolboxContext';
import { useIsSelecting } from '../../contexts/SelectedMessagesContext';
import { MessageActionMenu } from './MessageActionMenu';

const getMessageContext = (message: IMessage, room: IRoom): MessageActionContext => {
	if (message.t === 'videoconf') {
		return 'videoconf';
	}
	if (isRoomFederated(room)) {
		return 'federated';
	}
	return 'message';
};

export const Toolbox: FC<{ message: IMessage }> = ({ message }) => {
	const t = useTranslation();

	const room = useRoom();

	const subscription = useUserSubscription(message.rid);
	const settings = useSettings();
	const user = useUser() as IUser;

	const context = getMessageContext(message, room);

	const mapSettings = useMemo(() => Object.fromEntries(settings.map((setting) => [setting._id, setting.value])), [settings]);

	const messageActions = MessageAction.getButtons({ message, room, user, subscription, settings: mapSettings }, context, 'message');

	const menuActions = MessageAction.getButtons({ message, room, user, subscription, settings: mapSettings }, context, 'menu');

	const toolbox = useToolboxContext();

	const isSelecting = useIsSelecting();

	const chat = useChat();

	if (isSelecting) {
		return null;
	}

	return (
		<MessageToolbox>
			{messageActions.map((action) => (
				<MessageToolboxItem
					onClick={(e): void => {
						e.stopPropagation();
						action.action(e, { message, tabbar: toolbox, room, chat });
					}}
					key={action.id}
					icon={action.icon}
					title={t(action.label)}
					data-qa-id={action.label}
					data-qa-type='message-action-menu'
				/>
			))}
			{menuActions.length > 0 && (
				<MessageActionMenu
					options={menuActions.map((action) => ({
						...action,
						action: (e): void => {
							e.stopPropagation();
							action.action(e, { message, tabbar: toolbox, room, chat });
						},
					}))}
					data-qa-type='message-action-menu-options'
				/>
			)}
		</MessageToolbox>
	);
};

export default memo(Toolbox);
