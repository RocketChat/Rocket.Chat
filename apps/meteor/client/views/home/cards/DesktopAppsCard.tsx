import type { Card } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericCard, GenericCardButton } from '../../../components/GenericCard';
import { useExternalLink } from '../../../hooks/useExternalLink';

const WINDOWS_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-windows';
const LINUX_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-linux';
const MAC_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-mac';

const DesktopAppsCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement => {
	const { t } = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<GenericCard
			title={t('Desktop_apps')}
			body={t('Install_rocket_chat_on_your_preferred_desktop_platform')}
			buttons={[
				<GenericCardButton key={1} onClick={() => handleOpenLink(WINDOWS_APP_URL)} children={t('Platform_Windows')} role='link' />,
				<GenericCardButton key={2} onClick={() => handleOpenLink(LINUX_APP_URL)} children={t('Platform_Linux')} role='link' />,
				<GenericCardButton key={3} onClick={() => handleOpenLink(MAC_APP_URL)} children={t('Platform_Mac')} role='link' />,
			]}
			width='x340'
			data-qa-id='homepage-desktop-apps-card'
			{...props}
		/>
	);
};

export default DesktopAppsCard;
