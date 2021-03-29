import { IconProps, ButtonGroup } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { Content } from '..';
import { TranslationKey } from '../../../contexts/TranslationContext';
import Action from './Action';

type RunAction = () => void;

type ActionOptions = {
	mid: string;
	id: string;
	icon: IconProps['name'];
	i18nLabel?: TranslationKey;
	label?: string;
	runAction?: RunAction;
};

const Actions: FC<{ actions: Array<ActionOptions>; runAction: RunAction; mid: string }> = ({
	actions,
	runAction,
}) => (
	<Content width='full' justifyContent='center'>
		<ButtonGroup align='center'>
			{actions.map((action) => (
				<Action runAction={runAction} key={action.id} {...action} />
			))}
		</ButtonGroup>
	</Content>
);

export default Actions;
