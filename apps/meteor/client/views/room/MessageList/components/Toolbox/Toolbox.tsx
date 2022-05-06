import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { MessageToolbox, MessageToolboxItem } from '@rocket.chat/fuselage';
import { useUser, useUserRoom, useUserSubscription, useSettings, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo, useMemo } from 'react';

import { MessageAction } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { getTabBarContext } from '../../../lib/Toolbox/ToolboxContext';
import { useIsSelecting } from '../../contexts/SelectedMessagesContext';
import { MessageActionMenu } from './MessageActionMenu';

export const Toolbox: FC<{ message: IMessage }> = ({ message }) => {
	const t = useTranslation();

	const room = useUserRoom(message.rid);

	if (!room) {
		throw new Error('Room not found');
	}

	const subscription = useUserSubscription(message.rid);
	const settings = useSettings();
	const user = useUser() as IUser;

	const mapSettings = useMemo(() => Object.fromEntries(settings.map((setting) => [setting._id, setting.value])), [settings]);

	const messageActions = MessageAction.getButtons({ message, room, user, subscription, settings: mapSettings }, 'message', 'message');

	const menuActions = MessageAction.getButtons({ message, room, user, subscription, settings: mapSettings }, 'message', 'menu');

	const tabbar = getTabBarContext(message.rid);

	const isSelecting = useIsSelecting();

	if (isSelecting) {
		return null;
	}

	return (
		<MessageToolbox>
			{messageActions.map((action) => (
				<MessageToolboxItem
					onClick={(e): void => {
						action.action(e, { message, tabbar, room });
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
							action.action(e, { message, tabbar, room });
						},
					}))}
					data-qa-type='message-action-menu-options'
				/>
			)}
		</MessageToolbox>
	);
};

export default memo(Toolbox);
