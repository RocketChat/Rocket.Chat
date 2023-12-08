import type { Card } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import GenericCard from '../../../components/GenericCard';
import { useExternalLink } from '../../../hooks/useExternalLink';

const WINDOWS_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-windows';
const LINUX_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-linux';
const MAC_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-mac';

const DesktopAppsCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement => {
	const t = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<GenericCard
			title={t('Desktop_apps')}
			body={t('Install_rocket_chat_on_your_preferred_desktop_platform')}
			buttons={[
				{ onClick: () => handleOpenLink(WINDOWS_APP_URL), label: t('Platform_Windows'), role: 'link' },
				{ onClick: () => handleOpenLink(LINUX_APP_URL), label: t('Platform_Linux'), role: 'link' },
				{ onClick: () => handleOpenLink(MAC_APP_URL), label: t('Platform_Mac'), role: 'link' },
			]}
			data-qa-id='homepage-desktop-apps-card'
			{...props}
		/>
	);
};

export default DesktopAppsCard;
