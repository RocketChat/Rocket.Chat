import { useOmnichannel } from '@rocket.chat/ui-contexts';

export const useOmnichannelEnabled = (): boolean => useOmnichannel().enabled;
