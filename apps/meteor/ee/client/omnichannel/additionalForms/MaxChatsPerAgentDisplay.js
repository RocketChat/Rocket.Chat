import React from 'react';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import UserInfo from '../../../../client/views/room/contextualBar/UserInfo';

const MaxChatsPerAgentDisplay = ({ data: { livechat: { maxNumberSimultaneousChat = '' } = {} } = {} }) => {
	const t = useTranslation();
	return (
		maxNumberSimultaneousChat && (
			<>
				<UserInfo.Label>{t('Max_number_of_chats_per_agent')}</UserInfo.Label>
				<UserInfo.Info>{maxNumberSimultaneousChat}</UserInfo.Info>
			</>
		)
	);
};

export default MaxChatsPerAgentDisplay;
