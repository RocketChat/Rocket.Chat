import { States, StatesIcon, StatesTitle, StatesSubtitle, Box } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivateEmptyState = () => {
	const { t } = useTranslation();

	return (
		<Box mbs='24px'>
			<States>
				<StatesIcon name='lock' />
				<StatesTitle>{t('No_private_apps_installed')}</StatesTitle>
				<StatesSubtitle>{t('Private_apps_are_side-loaded')}</StatesSubtitle>
			</States>
		</Box>
	);
};

export default PrivateEmptyState;
