import { Button } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useExternalLink } from '../../../hooks/useExternalLink';

const GOOGLE_PLAY_URL = 'https://go.rocket.chat/i/hp-mobile-app-google';
const APP_STORE_URL = 'https://go.rocket.chat/i/hp-mobile-app-apple';

const MobileAppsCard = (): ReactElement => {
	const t = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<Card data-qa-id='homepage-mobile-apps-card'>
			<Card.Title>{t('Mobile_apps')}</Card.Title>
			<Card.Body>{t('Take_rocket_chat_with_you_with_mobile_applications')}</Card.Body>
			<Card.FooterWrapper>
				<Card.Footer>
					<Button onClick={() => handleOpenLink(GOOGLE_PLAY_URL)}>{t('Google_Play')}</Button>
					<Button onClick={() => handleOpenLink(APP_STORE_URL)}>{t('App_Store')}</Button>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default MobileAppsCard;
