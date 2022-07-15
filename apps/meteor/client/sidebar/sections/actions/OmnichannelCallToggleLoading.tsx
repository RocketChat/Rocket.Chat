import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const OmnichannelCallToggleLoading = ({ ...props }): ReactElement => {
	const t = useTranslation();
	return <Sidebar.TopBar.Action icon='phone' data-title={t('Loading')} disabled {...props} />;
};
