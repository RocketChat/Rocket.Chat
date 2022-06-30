import { useCallClient } from '../../../client/contexts/CallContext';
import { EEVoipClient } from '../lib/voip/EEVoipClient';
import { useHasLicense } from './useHasLicense';

export const useOutboundDialer = (): EEVoipClient | null => {
	const voipClient = useCallClient();
	const isEnterprise = useHasLicense('voip-enterprise') === true;
	const isOutboundClient = voipClient instanceof EEVoipClient;

	return isEnterprise && isOutboundClient ? voipClient : null;
};
