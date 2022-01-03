import { Sidebar } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

export const OmnichannelCallToggleError = (): ReactElement => {
	const t = useTranslation();
	return <Sidebar.TopBar.Action icon='phone' danger data-title={t('Error')} disabled />;
};
