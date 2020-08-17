import React from 'react';
import { Box } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

const MaxChatsPerAgentDisplay = ({ data: { livechat: { maxNumberSimultaneousChat = '' } = {} } = {} }) => {
	const t = useTranslation();


	return <Box>
		<Box fontScale='p2' color='default'>{t('Max_number_of_chats_per_agent')}</Box>
		<Box mb='x4' is='span' fontSize='p1' fontScale='p1' color='hint' withTruncatedText>	{maxNumberSimultaneousChat} </Box>;
	</Box>;
};

export default MaxChatsPerAgentDisplay;
