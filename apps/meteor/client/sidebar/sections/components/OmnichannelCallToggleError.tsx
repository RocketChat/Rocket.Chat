import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const OmnichannelCallToggleError = (): ReactElement => {
	const t = useTranslation();
	return <Sidebar.TopBar.Action icon='phone' danger data-title={t('Error')} disabled />;
};
