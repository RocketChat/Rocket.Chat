import { useTranslation } from 'react-i18next';

import { InfoPanelLabel, InfoPanelText } from '../../components/InfoPanel';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

const MaxChatsPerAgentDisplay = ({ maxNumberSimultaneousChat = 0 }) => {
	const { t } = useTranslation();
	const hasLicense = useHasLicenseModule('livechat-enterprise');

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
