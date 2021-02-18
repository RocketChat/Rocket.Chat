import React, { FC } from 'react';
import { IconProps, Icon, Button, ButtonGroup } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { Content } from '..';

type RunAction = () => void;

type ActionOptions = {
	mid: string;
	id: string;
	icon: IconProps['name'];
	i18nLabel?: string;
	label?: string;
	runAction?: RunAction;
};

const resolveLegacyIcon = (legacyIcon: string | undefined): string | undefined => {
	if (legacyIcon === 'icon-videocam') {
		return 'video';
	}

	return legacyIcon && legacyIcon.replace(/^icon-/, '');
};

export const Action: FC<ActionOptions> = ({ id, icon, i18nLabel, label, mid, runAction }) => {
	const t = useTranslation();

	const resolvedIcon = resolveLegacyIcon(icon);

	return <Button id={id} data-mid={mid} data-actionlink={id} onClick={runAction} primary small>{icon && <Icon name={resolvedIcon}/>}{i18nLabel ? t(i18nLabel) : label }</Button>;
};

const Actions: FC<{ actions: Array<ActionOptions>; runAction: RunAction; mid: string }> = ({ actions, runAction }) => <Content width='full' justifyContent='center'><ButtonGroup align='center'>{actions.map((action) => <Action runAction={runAction} key={action.id} {...action}/>)}</ButtonGroup></Content>;

export default Actions;
