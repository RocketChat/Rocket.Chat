import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { cannedResponsesQueryKeys } from '../../../lib/queryKeys';

export const useCannedResponseList = ({ filter, type }: { filter: string; type: string }) => {
	const getCannedResponses = useEndpoint('GET', '/v1/canned-responses');
	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	const count = 25;

	return useInfiniteQuery({
		queryKey: cannedResponsesQueryKeys.list({ filter, type }),
		queryFn: async ({ pageParam: offset }) => {
			const { cannedResponses, total } = await getCannedResponses({
				...(filter && { text: filter }),
				...(type && ['global', 'user'].find((option) => option === type) && { scope: type }),
				...(type &&
					!['global', 'user', 'all'].find((option) => option === type) && {
						scope: 'department',
						departmentId: type,
					}),
				offset,
				count,
			});

			const { departments } = await getDepartments({ text: '' });

			return {
				items: cannedResponses.map((cannedResponse): IOmnichannelCannedResponse & { departmentName: ILivechatDepartment['name'] } => {
					const departmentName = cannedResponse.departmentId
						? departments.find((department) => department._id === cannedResponse.departmentId)?.name
						: undefined;

					return {
						...cannedResponse,
						_updatedAt: new Date(cannedResponse._updatedAt),
						_createdAt: new Date(cannedResponse._createdAt),
						departmentName: departmentName!,
					};
				}),
				itemCount: total,
			};
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, _, lastOffset) => {
			const nextOffset = lastOffset + count;
			if (nextOffset >= lastPage.itemCount) return undefined;
			return nextOffset;
		},
		select: ({ pages }) => ({
			cannedItems: pages.flatMap((page) => page.items),
			total: pages.at(-1)?.itemCount,
		}),
	});
};
