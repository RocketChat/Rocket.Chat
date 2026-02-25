import type { Card } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericCard, GenericCardButton } from '../../../components/GenericCard';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { links } from '../../../lib/links';

const GOOGLE_PLAY_URL = links.go.mobileAppGoogle;
const APP_STORE_URL = links.go.mobileAppApple;

const MobileAppsCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement => {
	const { t } = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<GenericCard
			title={t('Mobile_apps')}
			body={t('Take_rocket_chat_with_you_with_mobile_applications')}
			buttons={[
				<GenericCardButton key={1} onClick={() => handleOpenLink(GOOGLE_PLAY_URL)} role='link'>
					{t('Google_Play')}
				</GenericCardButton>,
				<GenericCardButton key={2} onClick={() => handleOpenLink(APP_STORE_URL)} role='link'>
					{t('App_Store')}
				</GenericCardButton>,
			]}
			width='x340'
			{...props}
		/>
	);
};

export default MobileAppsCard;
