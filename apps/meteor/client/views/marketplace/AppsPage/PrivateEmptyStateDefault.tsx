import { States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const PrivateEmptyStateDefault = () => {
	const { t } = useTranslation();

	return (
		<States>
			<StatesIcon name='lock' />
			<StatesTitle>{t('No_private_apps_installed')}</StatesTitle>
			<StatesSubtitle>{t('Private_apps_upgrade_empty_state_description')}</StatesSubtitle>
		</States>
	);
};

export default PrivateEmptyStateDefault;
