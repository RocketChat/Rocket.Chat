import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import AppsPageEmptyState from './layout/AppsPageEmptyState';

const AppsPageContentError = ({ onButtonClick }: { onButtonClick: () => void }) => {
	const { t } = useTranslation();

	return (
		<AppsPageEmptyState offset='x20'>
			<States>
				<StatesIcon variation='danger' name='circle-exclamation' />
				<StatesTitle>{t('Connection_error')}</StatesTitle>
				<StatesSubtitle>{t('Marketplace_error')}</StatesSubtitle>
				<StatesActions>
					<StatesAction icon='reload' onClick={onButtonClick}>
						{t('Reload_page')}
					</StatesAction>
				</StatesActions>
			</States>
		</AppsPageEmptyState>
	);
};

export default AppsPageContentError;
