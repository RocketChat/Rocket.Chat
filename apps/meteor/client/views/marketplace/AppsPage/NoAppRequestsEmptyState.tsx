import { Box, States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const NoAppRequestsEmptyState = () => {
	const { t } = useTranslation();

	return (
		<Box mbs='24px'>
			<States>
				<StatesIcon name='cube' />
				<StatesTitle>{t('No_requested_apps')}</StatesTitle>
				<StatesSubtitle>{t('Requested_apps_will_appear_here')}</StatesSubtitle>
			</States>
		</Box>
	);
};

export default NoAppRequestsEmptyState;
