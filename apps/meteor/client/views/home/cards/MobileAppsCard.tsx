import type { Card } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericCard, GenericCardButton } from '../../../components/GenericCard';
import { useExternalLink } from '../../../hooks/useExternalLink';

const GOOGLE_PLAY_URL = 'https://go.rocket.chat/i/hp-mobile-app-google';
const APP_STORE_URL = 'https://go.rocket.chat/i/hp-mobile-app-apple';

const MobileAppsCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement => {
	const { t } = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<GenericCard
			title={t('Mobile_apps')}
			body={t('Take_rocket_chat_with_you_with_mobile_applications')}
			buttons={[
				<GenericCardButton key={1} onClick={() => handleOpenLink(GOOGLE_PLAY_URL)} children={t('Google_Play')} role='link' />,
				<GenericCardButton key={2} onClick={() => handleOpenLink(APP_STORE_URL)} children={t('App_Store')} role='link' />,
			]}
			data-qa-id='homepage-mobile-apps-card'
			width='x340'
			{...props}
		/>
	);
};

export default MobileAppsCard;
