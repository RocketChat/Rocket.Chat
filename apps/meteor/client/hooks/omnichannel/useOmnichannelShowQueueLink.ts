import { useOmnichannel } from '@rocket.chat/ui-contexts';

export const useOmnichannelShowQueueLink = (): boolean => useOmnichannel().showOmnichannelQueueLink;
