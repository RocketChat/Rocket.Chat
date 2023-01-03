import { Button } from '@rocket.chat/fuselage';
import { ExternalLink, Card } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const WINDOWS_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-windows';
const LINUX_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-linux';
const MAC_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-mac';

const DesktopAppsCard = (): ReactElement => {
	const t = useTranslation();

	return (
		<Card variant='light' data-qa-id='homepage-desktop-apps-card'>
			<Card.Title>{t('Desktop_apps')}</Card.Title>
			<Card.Body>{t('Install_rocket_chat_on_your_preferred_desktop_platform')}</Card.Body>
			<Card.FooterWrapper>
				<Card.Footer>
					<ExternalLink to={WINDOWS_APP_URL}>
						<Button>{t('Platform_Windows')}</Button>
					</ExternalLink>
					<ExternalLink to={LINUX_APP_URL}>
						<Button>{t('Platform_Linux')}</Button>
					</ExternalLink>
					<ExternalLink to={MAC_APP_URL}>
						<Button>{t('Platform_Mac')}</Button>
					</ExternalLink>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default DesktopAppsCard;
