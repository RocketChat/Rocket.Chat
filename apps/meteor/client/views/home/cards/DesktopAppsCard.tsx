import { Button } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
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
			<Card.Title>{t('Desktop_apps')}</Card.Title>
			<Card.Body>{t('Install_rocket_chat_on_your_preferred_desktop_platform')}</Card.Body>
			<Card.FooterWrapper>
				<Card.Footer>
					<Button onClick={() => handleOpenLink(WINDOWS_APP_URL)}>{t('Platform_Windows')}</Button>
					<Button onClick={() => handleOpenLink(LINUX_APP_URL)}>{t('Platform_Linux')}</Button>
					<Button onClick={() => handleOpenLink(MAC_APP_URL)}>{t('Platform_Mac')}</Button>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default DesktopAppsCard;
