import { States, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const NoAppRequestsEmptyState = () => {
	const t = useTranslation();

	return (
		<States>
			<StatesTitle>{t('No_requests')}</StatesTitle>
			<StatesSubtitle>Requested apps will appear here</StatesSubtitle>
		</States>
	);
};

export default NoAppRequestsEmptyState;
