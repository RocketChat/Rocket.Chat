import { Sidebar } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export const OmnichannelCallToggleError = ({ ...props }): ReactElement => {
	const { t } = useTranslation();
	return <Sidebar.TopBar.Action icon='phone' danger data-tooltip={t('Error')} disabled {...props} />;
};
