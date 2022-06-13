import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardFooter from '../../../components/Card/Footer';
import CardTitle from '../../../components/Card/Title';
import ExternalLink from '../../../components/ExternalLink';

const GOOGLE_PLAY_URL = 'https://google.com';
const APP_STORE_URL = 'https://google.com';

// Mobile Apps card for homepage
const MobileAppsCard = (): ReactElement => {
	const t = useTranslation();

	return (
		<Card variant='light'>
			<CardTitle>{t('Homepage_card_mobile_apps_title')}</CardTitle>

			<CardBody>{t('Homepage_card_mobile_apps_description')}</CardBody>

			<CardFooterWrapper>
				<CardFooter>
					<ExternalLink to={GOOGLE_PLAY_URL}>
						<Button>{t('Homepage_card_mobile_apps_action_button_google')}</Button>
					</ExternalLink>
					<ExternalLink to={APP_STORE_URL}>
						<Button>{t('Homepage_card_mobile_apps_action_button_apple')}</Button>
					</ExternalLink>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default MobileAppsCard;
