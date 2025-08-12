import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const NoInstalledAppsEmptyState = ({ onButtonClick }: { onButtonClick: () => void }): ReactElement => {
	const { t } = useTranslation();

	return (
		<Box mbs={20}>
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

export default NoInstalledAppsEmptyState;
