import { MessageToolbox } from '@rocket.chat/fuselage';
import React, { FC, memo, MouseEvent, useMemo } from 'react';

import { MessageAction } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { IMessage } from '../../../../../../definition/IMessage';
import { IUser } from '../../../../../../definition/IUser';
import { useSettings } from '../../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUser, useUserRoom, useUserSubscription } from '../../../../../contexts/UserContext';
import { MessageActionMenu } from './MessageActionMenu';

export const Toolbox: FC<{ message: IMessage }> = ({ message }) => {
	const t = useTranslation();

	const room = useUserRoom(message.rid);
	const subscription = useUserSubscription(message.rid);
	const settings = useSettings();
	const user = useUser() as IUser;

	const mapSettings = useMemo(
		() => Object.fromEntries(settings.map((setting) => [setting._id, setting.value])),
		[settings],
	);

	const messageActions = MessageAction.getButtons(
		{ message, room, user, subscription, settings: mapSettings },
		'message',
		'message',
	);

	const menuActions = MessageAction.getButtons(
		{ message, room, user, subscription, settings: mapSettings },
		'message',
		'menu',
	);

	return (
		<MessageToolbox>
			{messageActions.map((action) => (
				<MessageToolbox.Item
					onClick={(e: MouseEvent): void => {
						action.action(e, { message });
					}}
					key={action.id}
					icon={action.icon}
					title={t(action.label)}
				/>
			))}
			{menuActions.length > 0 && <MessageActionMenu options={menuActions} />}
		</MessageToolbox>
	);
};

export default memo(Toolbox);
