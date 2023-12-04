import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericCard from '../../../components/GenericCard';
import { useExternalLink } from '../../../hooks/useExternalLink';

const WINDOWS_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-windows';
const LINUX_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-linux';
const MAC_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-mac';

const DesktopAppsCard = (): ReactElement => {
	const t = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<GenericCard
			title={t('Desktop_apps')}
			body={t('Install_rocket_chat_on_your_preferred_desktop_platform')}
			controls={[
				{ onClick: () => handleOpenLink(WINDOWS_APP_URL), label: t('Platform_Windows') },
				{ onClick: () => handleOpenLink(LINUX_APP_URL), label: t('Platform_Linux') },
				{ onClick: () => handleOpenLink(MAC_APP_URL), label: t('Platform_Mac') },
			]}
			data-qa-id='homepage-desktop-apps-card'
		/>
	);
};

export default DesktopAppsCard;
