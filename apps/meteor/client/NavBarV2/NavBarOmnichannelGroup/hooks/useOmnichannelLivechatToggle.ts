import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Keys } from '@rocket.chat/icons';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useOmnichannelAgentAvailable } from '../../../hooks/omnichannel/useOmnichannelAgentAvailable';

export const useOmnichannelLivechatToggle = () => {
	const { t } = useTranslation();
	const agentAvailable = useOmnichannelAgentAvailable();
	const changeAgentStatus = useEndpoint('POST', '/v1/livechat/agent.status');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleAvailableStatusChange = useEffectEvent(async () => {
		try {
			await changeAgentStatus({});
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return {
		title: agentAvailable ? t('Turn_off_answer_chats') : t('Turn_on_answer_chats'),
		isSuccess: agentAvailable,
		icon: (agentAvailable ? 'message' : 'message-disabled') as Keys,
		handleAvailableStatusChange,
	};
};
