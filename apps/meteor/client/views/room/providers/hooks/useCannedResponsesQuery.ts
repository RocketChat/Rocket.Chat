import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useEndpoint, usePermission, useSetting, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { cannedResponsesQueryKeys } from '../../../../lib/queryKeys';

type CannedResponse = { _id: string; shortcut: string; text: string };

const useCannedResponsesQuery = (room: IRoom) => {
	const isOmnichannel = isOmnichannelRoom(room);
	const uid = useUserId();
	const isCannedResponsesEnabled = useSetting('Canned_Responses_Enable', true);
	const canViewCannedResponses = usePermission('view-canned-responses');
	const subscribeToCannedResponses = useStream('canned-responses');

	const enabled = isOmnichannel && !!uid && isCannedResponsesEnabled && canViewCannedResponses;

	const getCannedResponses = useEndpoint('GET', '/v1/canned-responses.get');

	const queryClient = useQueryClient();

	useEffect(() => {
		if (!enabled) return;

		return subscribeToCannedResponses('canned-responses', (...[response, options]) => {
			const { agentsId } = options || {};
			if (Array.isArray(agentsId) && !agentsId.includes(uid)) {
				return;
			}

			switch (response.type) {
				case 'changed': {
					const { _id, shortcut, text } = response;
					queryClient.setQueryData<CannedResponse[]>(cannedResponsesQueryKeys.all, (responses) =>
						responses?.filter((response) => response._id !== _id).concat([{ _id, shortcut, text }]),
					);
					break;
				}

				case 'removed': {
					const { _id } = response;
					queryClient.setQueryData<CannedResponse[]>(cannedResponsesQueryKeys.all, (responses) =>
						responses?.filter((response) => response._id !== _id),
					);
					break;
				}
			}
		});
	}, [enabled, getCannedResponses, queryClient, subscribeToCannedResponses, uid]);

	return useQuery<CannedResponse[]>({
		queryKey: cannedResponsesQueryKeys.all,
		queryFn: async () => {
			const { responses } = await getCannedResponses();
			return responses.map(({ _id, shortcut, text }) => ({ _id, shortcut, text }));
		},
		enabled,
		staleTime: Infinity,
	});
};

export default useCannedResponsesQuery;
