import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

const AppsPageContentError = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const handleReloadClick = () => {
		queryClient.invalidateQueries(['marketplace']);
	};

	return (
		<Box mbs={20}>
			<States>
				<StatesIcon variation='danger' name='circle-exclamation' />
				<StatesTitle>{t('Connection_error')}</StatesTitle>
				<StatesSubtitle>{t('Marketplace_error')}</StatesSubtitle>
				<StatesActions>
					<StatesAction icon='reload' onClick={handleReloadClick}>
						{t('Reload_page')}
					</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default AppsPageContentError;
