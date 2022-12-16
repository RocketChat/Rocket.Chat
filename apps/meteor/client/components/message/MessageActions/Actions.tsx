import type { IconProps } from '@rocket.chat/fuselage';
import { ButtonGroup } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import Content from '../Metrics/Content';
import Action from './Action';

type RunAction = (action: string) => () => void;

type MessageActionOptions = {
	icon: IconProps['name'];
	i18nLabel?: TranslationKey;
	label?: string;
	methodId: string;
	runAction?: RunAction;
	actionLinksAlignment?: string;
};

const MessageActions: FC<{
	actions: Array<MessageActionOptions>;
	runAction: RunAction;
	mid: string;
}> = ({ actions, runAction }) => {
	const alignment = actions[0]?.actionLinksAlignment || 'center';

	return (
		<Content width='full' justifyContent={alignment}>
			<ButtonGroup align='center'>
				{actions.map((action, key) => (
					<Action runAction={runAction} key={key} {...action} />
				))}
			</ButtonGroup>
		</Content>
	);
};

export default MessageActions;
