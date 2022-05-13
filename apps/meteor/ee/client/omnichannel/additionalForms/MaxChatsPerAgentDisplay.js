import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

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
