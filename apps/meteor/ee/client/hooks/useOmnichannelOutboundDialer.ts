import { useCallClient, useIsVoipEnterprise } from '../../../client/contexts/OmnichannelCallContext';
import { EEVoipClient } from '../lib/voip/EEVoipClient';

export const useOmnichannelOutboundDialer = (): EEVoipClient | null => {
	const voipClient = useCallClient();
	const isEnterprise = useIsVoipEnterprise();
	const isOutboundClient = voipClient instanceof EEVoipClient;

	return isEnterprise && isOutboundClient ? voipClient : null;
};
