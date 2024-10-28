import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

const NoInstalledAppsEmptyState = () => {
	const { t } = useTranslation();

	const router = useRouter();

	const handleButtonClick = () => {
		router.navigate({
			name: 'marketplace',
			params: {
				context: 'explore',
				page: 'list',
			},
		});
	};

	return (
		<Box mbs={20}>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('No_apps_installed')}</StatesTitle>
				<StatesSubtitle>{t('Explore_the_marketplace_to_find_awesome_apps')}</StatesSubtitle>
				<StatesActions>
					<StatesAction onClick={handleButtonClick}>{t('Explore_marketplace')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default NoInstalledAppsEmptyState;
