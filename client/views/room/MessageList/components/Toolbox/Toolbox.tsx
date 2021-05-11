import { Message as MessageTemplate } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { MessageAction } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { useTranslation } from '../../../../../contexts/TranslationContext';

export const Toolbox: FC<{}> = () => {
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
				<MessageTemplate.Toolbox.Item key={action.id} icon={action.icon} title={t(action.label)} />
			))}
		</MessageTemplate.Toolbox>
	);
};

export default memo(Toolbox);
