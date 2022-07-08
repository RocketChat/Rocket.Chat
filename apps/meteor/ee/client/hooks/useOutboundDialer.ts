import { useCallClient, useIsVoipEnterprise } from '../../../client/contexts/CallContext';
import { EEVoipClient } from '../lib/voip/EEVoipClient';

export const useOutboundDialer = (): EEVoipClient | null => {
	const voipClient = useCallClient();
	const isEnterprise = useIsVoipEnterprise();
	const isOutboundClient = voipClient instanceof EEVoipClient;

	return isEnterprise && isOutboundClient ? voipClient : null;
};
