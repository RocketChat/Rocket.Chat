import type { Card } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericCard, GenericCardButton } from '../../../components/GenericCard';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { links } from '../../../lib/links';

const WINDOWS_APP_URL = links.go.desktopAppWindows;
const LINUX_APP_URL = links.go.desktopAppLinux;
const MAC_APP_URL = links.go.desktopAppMac;

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
			{...props}
		/>
	);
};

export default DesktopAppsCard;
