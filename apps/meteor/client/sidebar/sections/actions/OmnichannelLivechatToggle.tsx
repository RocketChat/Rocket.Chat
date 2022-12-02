import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useOmnichannelAgentAvailable } from '../../../hooks/omnichannel/useOmnichannelAgentAvailable';

export const OmnichannelLivechatToggle = (): ReactElement => {
	const t = useTranslation();
	const agentAvailable = useOmnichannelAgentAvailable();
	const changeAgentStatus = useEndpoint('POST', '/v1/livechat/agent.status');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleAvailableStatusChange = useMutableCallback(async () => {
		try {
			await changeAgentStatus({});
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return (
		<Sidebar.TopBar.Action
			id={'omnichannel-status-toggle'}
			data-tooltip={agentAvailable ? t('Turn_off_answer_chats') : t('Turn_on_answer_chats')}
			color={agentAvailable ? 'success' : undefined}
			icon={agentAvailable ? 'message' : 'message-disabled'}
			onClick={handleAvailableStatusChange}
		/>
	);
};
