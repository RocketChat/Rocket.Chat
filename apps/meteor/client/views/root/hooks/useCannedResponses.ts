import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useCanAccessCannedResponses } from './useCanAccessCannedResponses';
import { cannedResponsesQueryKeys } from '../../../lib/queryKeys';
import type { CannedResponse } from '../../room/providers/ComposerPopupProvider';

const isCannedResponse = (response: any): response is IOmnichannelCannedResponse => {
	return typeof response._id === 'string' && typeof response.shortcut === 'string' && typeof response.text === 'string';
};

export const useCannedResponses = () => {
	const uid = useUserId();
	const getCannedResponses = useEndpoint('GET', '/v1/canned-responses.get');
	const handleStreamCannedResponses = useStream('canned-responses');
	const canAccess = useCanAccessCannedResponses();

	const queryClient = useQueryClient();

	useEffect(() => {
		if (!canAccess) return;

		return handleStreamCannedResponses('canned-responses', (...[response, options]) => {
			const { agentsId } = options || {};
			if (Array.isArray(agentsId) && !agentsId.includes(uid)) return;

			const handleResponseObject = {
				changed: () => {
					if (isCannedResponse(response)) {
						const { _id, shortcut, text } = response;
						queryClient.setQueryData<CannedResponse[]>(cannedResponsesQueryKeys.all, (responses) =>
							responses?.filter((response) => response._id !== _id).concat([{ _id, shortcut, text }]),
						);
					}
				},
				removed: () => {
					const { _id } = response;
					queryClient.setQueryData<CannedResponse[]>(cannedResponsesQueryKeys.all, (responses) =>
						responses?.filter((response) => response._id !== _id),
					);
				},
				default: () => console.warn(`Unknown response type: ${response.type}`),
			};

			(handleResponseObject[response.type] || handleResponseObject.default)();
		});
	}, [canAccess, handleStreamCannedResponses, queryClient, uid]);

	const handleFetchCannedResponses = async () => {
		const { responses } = await getCannedResponses();
		return responses.map(({ _id, shortcut, text }) => ({ _id, shortcut, text }));
	};

	return useQuery<CannedResponse[]>({
		queryKey: cannedResponsesQueryKeys.all,
		queryFn: handleFetchCannedResponses,
		enabled: canAccess,
		staleTime: Infinity,
	});
};
