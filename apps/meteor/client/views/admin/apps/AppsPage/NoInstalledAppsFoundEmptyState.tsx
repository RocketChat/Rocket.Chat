import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

const NoInstalledAppsFoundEmptyState = ({ onButtonClick }: { onButtonClick: () => void }): ReactElement => {
	const t = useTranslation();

	return (
		<Box mbs='x20'>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('No_apps_installed')}</StatesTitle>
				<StatesSubtitle>{t('Explore_the_marketplace_to_find_awesome_apps')}</StatesSubtitle>
				<StatesActions>
					<StatesAction onClick={onButtonClick}>{t('Explore_marketplace')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default NoInstalledAppsFoundEmptyState;
