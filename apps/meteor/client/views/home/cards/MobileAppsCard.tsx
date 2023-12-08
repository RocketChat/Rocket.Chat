import type { Card } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import GenericCard from '../../../components/GenericCard';
import { useExternalLink } from '../../../hooks/useExternalLink';

const GOOGLE_PLAY_URL = 'https://go.rocket.chat/i/hp-mobile-app-google';
const APP_STORE_URL = 'https://go.rocket.chat/i/hp-mobile-app-apple';

const MobileAppsCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement => {
	const t = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<GenericCard
			title={t('Mobile_apps')}
			body={t('Take_rocket_chat_with_you_with_mobile_applications')}
			buttons={[
				{ onClick: () => handleOpenLink(GOOGLE_PLAY_URL), label: t('Google_Play') },
				{ onClick: () => handleOpenLink(APP_STORE_URL), label: t('App_Store') },
			]}
			data-qa-id='homepage-mobile-apps-card'
			{...props}
		/>
	);
};

export default MobileAppsCard;
