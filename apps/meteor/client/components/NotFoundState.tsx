import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useNavigate, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type NotFoundProps = {
	title: string;
	subtitle: string;
};

const NotFoundState = ({ title, subtitle }: NotFoundProps): ReactElement => {
	const t = useTranslation();
	const navigate = useNavigate();

	const handleGoHomeClick = () => {
		navigate('/home');
	};

	return (
		<Box display='flex' justifyContent='center' height='full'>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{title}</StatesTitle>
				<StatesSubtitle>{subtitle}</StatesSubtitle>
				<StatesActions mbs='x16'>
					<StatesAction onClick={handleGoHomeClick}>{t('Homepage')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default NotFoundState;
