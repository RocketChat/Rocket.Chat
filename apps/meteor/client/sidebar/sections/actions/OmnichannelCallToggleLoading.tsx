import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

export const OmnichannelCallToggleLoading = ({ ...props }): ReactElement => {
	const t = useTranslation();
	return <Sidebar.TopBar.Action icon='phone' data-tooltip={t('Loading')} aria-label={t('VoIP_Toggle')} disabled {...props} />;
};
