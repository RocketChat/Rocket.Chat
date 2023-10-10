import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useOmnichannelEnabled } from './useOmnichannelEnabled';

export const useIsOverMacLimit = (): boolean => {
	const isOmnichannelEnabled = useOmnichannelEnabled();
	const getMacLimit = useEndpoint('GET', '/v1/omnichannel/mac/check');
	const { data: { onLimit = true } = {} } = useQuery(['/v1/omnichannel/mac/check'], () => getMacLimit(), { enabled: isOmnichannelEnabled });

	return onLimit;
};
