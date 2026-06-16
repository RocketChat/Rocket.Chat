import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useConferenceCallUrl } from './useConferenceCallUrl';

export const useConferenceEmbedded = (callId: string) => {
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const getConferenceInfo = useEndpoint('GET', '/v1/video-conference.info');
	const getConferenceCallUrl = useConferenceCallUrl();

	// The chat room is identified by the conference record's `rid`, not a hardcoded type/name.
	const { data: info, isPending: isInfoPending } = useQuery({
		queryKey: ['conference-info', callId],
		queryFn: async () => getConferenceInfo({ callId }),
	});

	const { data, isPending } = useQuery({
		queryKey: ['conference-embedded', callId],
		queryFn: async () => joinConference({ callId, state: { mic: true, cam: false } }),
	});

	return {
		room: { rid: info?.rid, loading: isInfoPending } as const,
		conference: {
			url: data?.url ? getConferenceCallUrl(data.url) : undefined,
			providerName: data?.providerName,
			loading: isPending,
		} as const,
	};
};
