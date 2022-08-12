import { Button } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardFooter from '../../../components/Card/Footer';
import CardTitle from '../../../components/Card/Title';

const WINDOWS_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-windows';
const LINUX_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-linux';
const MAC_APP_URL = 'https://go.rocket.chat/i/hp-desktop-app-mac';

const DesktopAppsCard = (): ReactElement => {
	const t = useTranslation();

	return (
		<Card variant='light' data-qa-id='homepage-desktop-apps-card'>
			<CardTitle>{t('Desktop_apps')}</CardTitle>

			<CardBody>{t('Install_rocket_chat_on_the_your_preferred_desktop_platform')}</CardBody>

			<CardFooterWrapper>
				<CardFooter>
					<ExternalLink to={WINDOWS_APP_URL}>
						<Button>{t('Platform_Windows')}</Button>
					</ExternalLink>
					<ExternalLink to={LINUX_APP_URL}>
						<Button>{t('Platform_Linux')}</Button>
					</ExternalLink>
					<ExternalLink to={MAC_APP_URL}>
						<Button>{t('Platform_Mac')}</Button>
					</ExternalLink>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default DesktopAppsCard;
