import type { AbacMembershipGroup, AbacPreviewCursor, IAbacRoomMembershipPreview } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

import { ABACQueryKeys } from '../../../lib/queryKeys';

export const PREVIEW_MIN_MATCHES = 25;

export const usePreviewPages = (rid: string, attributes: Record<string, string[]>, filter: string, group: AbacMembershipGroup) => {
	const previewMembership = useEndpoint('POST', '/v1/abac/membership-preview');

	return useInfiniteQuery<
		IAbacRoomMembershipPreview,
		Error,
		InfiniteData<IAbacRoomMembershipPreview, AbacPreviewCursor | undefined>,
		ReturnType<typeof ABACQueryKeys.roomMembershipPreview.group>,
		AbacPreviewCursor | undefined
	>({
		queryKey: ABACQueryKeys.roomMembershipPreview.group(rid, attributes, filter, group),
		queryFn: async ({ pageParam }) => {
			const response = await previewMembership({
				rid,
				attributes,
				group,
				count: PREVIEW_MIN_MATCHES,
				...(filter && { filter }),
				...(pageParam && { after: pageParam }),
			});
			if (!('members' in response)) {
				throw new Error('error-invalid-room-membership-preview');
			}
			return response;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.next,
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		retry: false,
	});
};
