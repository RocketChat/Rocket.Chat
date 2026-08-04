import { useOmnichannel } from './useOmnichannel';

export const useOmnichannelAgentAvailable = (): boolean => useOmnichannel().agentAvailable;
