import { Sidebar } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export const OmnichannelCallToggleLoading = ({ ...props }): ReactElement => {
	const { t } = useTranslation();
	return <Sidebar.TopBar.Action icon='phone' data-tooltip={t('Loading')} aria-label={t('VoIP_Toggle')} disabled {...props} />;
};
