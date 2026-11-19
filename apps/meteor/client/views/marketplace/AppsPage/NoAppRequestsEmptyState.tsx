import { States, StatesIcon, StatesSubtitle, StatesTitle, Stack } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const NoAppRequestsEmptyState = () => {
	const { t } = useTranslation();

	return (
		<Stack grow justify='center'>
			<States>
				<StatesIcon name='cube' />
				<StatesTitle>{t('No_requested_apps')}</StatesTitle>
				<StatesSubtitle>{t('Requested_apps_will_appear_here')}</StatesSubtitle>
			</States>
		</Stack>
	);
};

export default NoAppRequestsEmptyState;
