import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

const NotFoundPage = (): ReactElement => {
	const t = useTranslation();
	const homeRoute = useRoute('home');

	const handleGoHomeClick = (): void => {
		homeRoute.push();
	};

	return (
		<Box display='flex' justifyContent='center' height='full' backgroundColor='surface'>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('Page_not_found')}</StatesTitle>
				<StatesSubtitle>{t('Page_not_exist_or_not_permission')}</StatesSubtitle>
				<StatesActions mbs='x16'>
					<StatesAction onClick={handleGoHomeClick}>{t('Homepage')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default NotFoundPage;
