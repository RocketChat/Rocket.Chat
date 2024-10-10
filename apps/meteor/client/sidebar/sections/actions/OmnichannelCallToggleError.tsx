import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

export const OmnichannelCallToggleError = ({ ...props }): ReactElement => {
	const t = useTranslation();
	return <Sidebar.TopBar.Action icon='phone' danger data-tooltip={t('Error')} disabled {...props} />;
};
