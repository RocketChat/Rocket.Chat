import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useOmnichannelAgentAvailable } from '../../../hooks/omnichannel/useOmnichannelAgentAvailable';

export const OmnichannelLivechatToggle = (): ReactElement => {
	const t = useTranslation();
	const agentAvailable = useOmnichannelAgentAvailable();
	const changeAgentStatus = useMethod('livechat:changeLivechatStatus');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleAvailableStatusChange = useMutableCallback(async () => {
		try {
			await changeAgentStatus();
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return (
		<Sidebar.TopBar.Action
			data-tooltip={agentAvailable ? t('Turn_off_answer_chats') : t('Turn_on_answer_chats')}
			color={agentAvailable ? 'success' : undefined}
			icon={agentAvailable ? 'message' : 'message-disabled'}
			onClick={handleAvailableStatusChange}
		/>
	);
};
