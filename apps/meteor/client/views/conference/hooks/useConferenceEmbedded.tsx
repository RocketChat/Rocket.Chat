import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useConferenceCallUrl } from './useConferenceCallUrl';

export const useConferenceEmbedded = (callId: string) => {
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const getConferenceCallUrl = useConferenceCallUrl();

	const { data, isPending } = useQuery({
		queryKey: ['conference-embedded', callId],
		queryFn: async () => joinConference({ callId, state: { mic: true, cam: false } }),
	});

	return {
		room: { type: 'c', reference: 'general', loading: isPending } as const,
		conference: {
			url: data?.url ? getConferenceCallUrl(data.url) : undefined,
			providerName: data?.providerName,
			loading: isPending,
		} as const,
	};
};
