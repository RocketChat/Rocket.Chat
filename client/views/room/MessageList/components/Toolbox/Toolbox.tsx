import { Message as MessageTemplate } from '@rocket.chat/fuselage';
import React, { FC, memo, MouseEvent } from 'react';

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
		<MessageTemplate.Toolbox>
			{messageActions.map((action) => (
				<MessageTemplate.Toolbox.Item
					onClick={(e: MouseEvent): void => {
						action.action(e, { message });
					}}
					key={action.id}
					icon={action.icon}
					title={t(action.label)}
				/>
			))}
			{menuActions.length > 0 && <MessageTemplate.Toolbox.Item icon={'kebab'} />}
		</MessageTemplate.Toolbox>
	);
};

export default memo(Toolbox);
