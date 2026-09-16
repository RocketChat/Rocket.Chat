import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export type MediaCallDevice = { id: string; name: string; appId: string };

/**
 * Lists the external devices (e.g. desk phones) the current user can place/receive calls on, as
 * provided by installed apps. Empty when no cti-capable app is present.
 */
export const useMediaCallDevices = (): MediaCallDevice[] => {
	const getDevices = useEndpoint('GET', '/v1/media-calls.devices');

	const { data } = useQuery({
		queryKey: ['media-calls', 'devices'],
		queryFn: async () => (await getDevices()).devices,
		staleTime: 60_000,
	});

	return data ?? [];
};
