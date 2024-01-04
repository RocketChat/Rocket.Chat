import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserInfo from '../../../../client/components/UserInfo';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

const MaxChatsPerAgentDisplay = ({ maxNumberSimultaneousChat = 0 }) => {
	const t = useTranslation();
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return (
		<>
			<UserInfo.Label>{t('Max_number_of_chats_per_agent')}</UserInfo.Label>
			<UserInfo.Info>{maxNumberSimultaneousChat}</UserInfo.Info>
		</>
	);
};

export default MaxChatsPerAgentDisplay;
