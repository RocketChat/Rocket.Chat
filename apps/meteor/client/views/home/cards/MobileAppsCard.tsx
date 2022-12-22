import { Button } from '@rocket.chat/fuselage';
import { ExternalLink, Card } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const GOOGLE_PLAY_URL = 'https://go.rocket.chat/i/hp-mobile-app-google';
const APP_STORE_URL = 'https://go.rocket.chat/i/hp-mobile-app-apple';

const MobileAppsCard = (): ReactElement => {
	const t = useTranslation();

	return (
		<Card variant='light' data-qa-id='homepage-mobile-apps-card'>
			<Card.Title>{t('Mobile_apps')}</Card.Title>
			<Card.Body>{t('Take_rocket_chat_with_you_with_mobile_applications')}</Card.Body>
			<Card.FooterWrapper>
				<Card.Footer>
					<ExternalLink to={GOOGLE_PLAY_URL}>
						<Button>{t('Google_Play')}</Button>
					</ExternalLink>
					<ExternalLink to={APP_STORE_URL}>
						<Button>{t('App_Store')}</Button>
					</ExternalLink>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default MobileAppsCard;
