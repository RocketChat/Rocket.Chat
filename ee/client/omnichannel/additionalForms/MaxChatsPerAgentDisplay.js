import React from 'react';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import UserInfo from '../../../../client/components/basic/UserInfo';

const MaxChatsPerAgentDisplay = ({ data: { livechat: { maxNumberSimultaneousChat = '' } = {} } = {} }) => {
	const t = useTranslation();

	return <>
		<UserInfo.Label>{t('Max_number_of_chats_per_agent')}</UserInfo.Label>
		<UserInfo.Info>{maxNumberSimultaneousChat}</UserInfo.Info>
	</>;
};

export default MaxChatsPerAgentDisplay;
