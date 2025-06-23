import { useOmnichannel } from '@rocket.chat/ui-contexts';

export const useOmnichannelAgentAvailable = (): boolean => useOmnichannel().agentAvailable;
