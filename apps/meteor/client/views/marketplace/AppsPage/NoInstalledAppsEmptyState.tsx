import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction, Stack } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const NoInstalledAppsEmptyState = ({ onButtonClick }: { onButtonClick: () => void }) => {
	const { t } = useTranslation();

	return (
		<Stack grow justify='center'>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('No_apps_installed')}</StatesTitle>
				<StatesSubtitle>{t('Explore_the_marketplace_to_find_awesome_apps')}</StatesSubtitle>
				<StatesActions>
					<StatesAction onClick={onButtonClick}>{t('Explore_marketplace')}</StatesAction>
				</StatesActions>
			</States>
		</Stack>
	);
};

export default NoInstalledAppsEmptyState;
