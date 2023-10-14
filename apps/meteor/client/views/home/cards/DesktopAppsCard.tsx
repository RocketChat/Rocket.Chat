import { Button } from '@rocket.chat/fuselage';
import { Card, CardBody, CardFooter, CardFooterWrapper, CardTitle } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useExternalLink } from '../../../hooks/useExternalLink';

const WINDOWS_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-windows';
const LINUX_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-linux';
const MAC_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-mac';

const DesktopAppsCard = (): ReactElement => {
	const t = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<Card data-qa-id='homepage-desktop-apps-card'>
			<CardTitle>{t('Desktop_apps')}</CardTitle>
			<CardBody>{t('Install_rocket_chat_on_your_preferred_desktop_platform')}</CardBody>
			<CardFooterWrapper>
				<CardFooter>
					<Button onClick={() => handleOpenLink(WINDOWS_APP_URL)}>{t('Platform_Windows')}</Button>
					<Button onClick={() => handleOpenLink(LINUX_APP_URL)}>{t('Platform_Linux')}</Button>
					<Button onClick={() => handleOpenLink(MAC_APP_URL)}>{t('Platform_Mac')}</Button>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default DesktopAppsCard;
