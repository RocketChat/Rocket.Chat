import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardFooter from '../../../components/Card/Footer';
import CardTitle from '../../../components/Card/Title';
import ExternalLink from '../../../components/ExternalLink';

const WINDOWS_APP_URL = 'https://google.com';
const LINUX_APP_URL = 'https://google.com';
const MAC_APP_URL = 'https://google.com';

// Mobile Apps card for homepage
const DesktopAppsCard = (): ReactElement => {
	const t = useTranslation();

	return (
		<Card variant='light'>
			<CardTitle>{t('Homepage_card_desktop_apps_title')}</CardTitle>

			<CardBody>{t('Homepage_card_desktop_apps_description')}</CardBody>

			<CardFooterWrapper>
				<CardFooter>
					<ExternalLink to={WINDOWS_APP_URL}>
						<Button>{t('Homepage_card_desktop_apps_action_button_windows')}</Button>
					</ExternalLink>
					<ExternalLink to={LINUX_APP_URL}>
						<Button>{t('Homepage_card_desktop_apps_action_button_linux')}</Button>
					</ExternalLink>
					<ExternalLink to={MAC_APP_URL}>
						<Button>{t('Homepage_card_desktop_apps_action_button_mac')}</Button>
					</ExternalLink>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default DesktopAppsCard;
