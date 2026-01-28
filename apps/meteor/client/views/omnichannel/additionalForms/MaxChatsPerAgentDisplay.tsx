import { InfoPanelLabel, InfoPanelText } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const MaxChatsPerAgentDisplay = ({ maxNumberSimultaneousChat = 0 }) => {
	const { t } = useTranslation();
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return (
		<>
			<InfoPanelLabel>{t('Max_number_of_chats_per_agent')}</InfoPanelLabel>
			<InfoPanelText>{maxNumberSimultaneousChat}</InfoPanelText>
		</>
	);
};

export default MaxChatsPerAgentDisplay;
