import { IconProps, ButtonGroup } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { TranslationKey } from '../../../contexts/TranslationContext';
import Content from '../Metrics/Content';
import Action from './Action';

type RunAction = () => void;

type ActionOptions = {
	mid: string;
	id: string;
	icon: IconProps['name'];
	i18nLabel?: TranslationKey;
	label?: string;
	runAction?: RunAction;
	actionLinksAlignment?: string;
};

const Actions: FC<{ actions: Array<ActionOptions>; runAction: RunAction; mid: string }> = ({ actions, runAction }) => {
	const alignment = actions[0]?.actionLinksAlignment || 'center';

	return (
		<Content width='full' justifyContent={alignment}>
			<ButtonGroup align='center'>
				{actions.map((action) => (
					<Action runAction={runAction} key={action.id} {...action} />
				))}
			</ButtonGroup>
		</Content>
	);
};

export default Actions;
