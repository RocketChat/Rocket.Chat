import { IconProps, Icon, Button } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { TranslationKey, useTranslation } from '../../../contexts/TranslationContext';

type RunAction = () => void;

type ActionOptions = {
	mid: string;
	id: string;
	icon: IconProps['name'];
	i18nLabel?: TranslationKey;
	label?: string;
	runAction?: RunAction;
	danger?: boolean;
};

const resolveLegacyIcon = (legacyIcon: string | undefined): string | undefined => {
	if (legacyIcon === 'icon-videocam') {
		return 'video';
	}

	return legacyIcon && legacyIcon.replace(/^icon-/, '');
};

const Action: FC<ActionOptions> = ({ id, icon, i18nLabel, label, mid, runAction, danger }) => {
	const t = useTranslation();

	const resolvedIcon = resolveLegacyIcon(icon);

	return (
		<Button
			id={id}
			data-mid={mid}
			data-actionlink={id}
			onClick={runAction}
			marginInline='x4'
			primary
			small
			danger={danger}
		>
			{icon && <Icon name={resolvedIcon} />}
			{i18nLabel ? t(i18nLabel) : label}
		</Button>
	);
};

export default Action;
