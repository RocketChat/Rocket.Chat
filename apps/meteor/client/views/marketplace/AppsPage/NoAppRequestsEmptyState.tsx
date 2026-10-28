import { States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import AppsPageEmptyState from './layout/AppsPageEmptyState';

const NoAppRequestsEmptyState = () => {
	const { t } = useTranslation();

	return (
		<AppsPageEmptyState offset='x24'>
			<States>
				<StatesIcon name='cube' />
				<StatesTitle>{t('No_requested_apps')}</StatesTitle>
				<StatesSubtitle>{t('Requested_apps_will_appear_here')}</StatesSubtitle>
			</States>
		</AppsPageEmptyState>
	);
};

export default NoAppRequestsEmptyState;
