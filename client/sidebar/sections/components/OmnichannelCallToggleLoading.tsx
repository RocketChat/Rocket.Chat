import { Sidebar } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

export const OmnichannelCallToggleLoading = (): ReactElement => {
	const t = useTranslation();
	return <Sidebar.TopBar.Action icon='phone' data-title={t('Loading')} disabled />;
};
