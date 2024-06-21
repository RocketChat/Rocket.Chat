import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { UserInfoLabel, UserInfoText } from '../../components/UserInfo';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

const MaxChatsPerAgentDisplay = ({ maxNumberSimultaneousChat = 0 }) => {
	const t = useTranslation();
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return (
		<>
			<UserInfoLabel>{t('Max_number_of_chats_per_agent')}</UserInfoLabel>
			<UserInfoText>{maxNumberSimultaneousChat}</UserInfoText>
		</>
	);
};

export default MaxChatsPerAgentDisplay;
