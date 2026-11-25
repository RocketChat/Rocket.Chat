import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { videoConferenceQueryKeys } from '../../../../lib/queryKeys';

/**
 * Whether the active video conference provider runs its calls inside the product. `false` while that is not known,
 * including when no provider answers: that answer is a configuration error, so it is not asked again.
 */
export const useEmbeddedVideoConfProvider = (enabled: boolean): boolean => {
	const getCapabilities = useEndpoint('GET', '/v1/video-conference.capabilities');

	const { data } = useQuery({
		queryKey: videoConferenceQueryKeys.capabilities(),
		queryFn: async () => (await getCapabilities()).capabilities,
		enabled,
		retry: false,
	});

	return enabled && data?.embedded === true;
};
