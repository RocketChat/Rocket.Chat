import { IconProps, Icon, Button } from '@rocket.chat/fuselage';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

type RunAction = (action: string) => () => void;

type ActionOptions = {
	icon: IconProps['name'];
	i18nLabel?: TranslationKey;
	label?: string;
	methodId: string;
	runAction: RunAction;
	danger?: boolean;
};

const resolveLegacyIcon = (legacyIcon: IconProps['name'] | `icon-${IconProps['name'] | 'videocam'}`): IconProps['name'] => {
	if (legacyIcon === 'icon-videocam') {
		return 'video';
	}

	return legacyIcon?.replace(/^icon-/, '') as IconProps['name'];
};

const Action: FC<ActionOptions> = ({ icon, methodId, i18nLabel, label, runAction, danger }) => {
	const t = useTranslation();

	const resolvedIcon = resolveLegacyIcon(icon);

	return (
		<Button data-method-id={methodId} onClick={runAction(methodId)} marginInline='x4' primary small danger={danger}>
			{icon && <Icon name={resolvedIcon} />}
			{i18nLabel ? t(i18nLabel) : label}
		</Button>
	);
};

export default Action;
