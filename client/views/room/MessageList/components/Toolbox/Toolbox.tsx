import { MessageToolbox, Option } from '@rocket.chat/fuselage';
import React, { FC, memo, MouseEvent, ReactNode } from 'react';

import { MessageAction } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { IMessage } from '../../../../../../definition/IMessage';
import { useTranslation } from '../../../../../contexts/TranslationContext';

export const Toolbox: FC<{ message: IMessage }> = ({ message }) => {
	const t = useTranslation();

	const messageActions = MessageAction.getButtonsByGroup(
		'message',
		MessageAction.getButtonsByContext('message', MessageAction._getButtons()),
	);

	const menuActions = MessageAction.getButtonsByGroup(
		'menu',
		MessageAction.getButtonsByContext('message', MessageAction._getButtons()),
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
			{menuActions.length > 0 && (
				<MessageToolbox.Menu
					onBlur={() =>{}}
					maxHeight='initial'
					renderItem={({ label: { label, icon }, ...props }): ReactNode => (
						<Option role='option' icon={icon} label={label} {...props} />
					)}
					options={menuActions.map((action) => ({
						label: {
							label: action.label,
							icon: action.icon,
						},
						value: action.id,
						action: (e: MouseEvent): void => {
							action.action(e, { message });
						},
					}))}
				/>
			)}
		</MessageToolbox>
	);
};

export default memo(Toolbox);
