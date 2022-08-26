import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useRoute, useTranslation, TranslationKey } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type NotFoundProps = {
	title: TranslationKey;
	subtitle: TranslationKey;
};

const NotFoundState = ({ title, subtitle }: NotFoundProps): ReactElement => {
	const t = useTranslation();
	const homeRoute = useRoute('home');

	const handleGoHomeClick = (): void => {
		homeRoute.push();
	};

	return (
		<Box display='flex' justifyContent='center' height='full' backgroundColor='surface'>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t(title)}</StatesTitle>
				<StatesSubtitle>{t(subtitle)}</StatesSubtitle>
				<StatesActions mbs='x16'>
					<StatesAction onClick={handleGoHomeClick}>{t('Homepage')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default NotFoundState;
