import { useCallback, useEffect, useState } from 'react';

import { useEndpoint } from '../../../../client/contexts/ServerContext';
import { useScrollableRecordList } from '../../../../client/hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../../client/hooks/useComponentDidUpdate';
import { CannedResponseList } from '../../../../client/lib/lists/CannedResponseList';

export const useCannedResponseList = (
	options: any,
): {
	reload: () => void;
	cannedList: CannedResponseList;
	initialItemCount: number;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [cannedList, setCannedList] = useState(() => new CannedResponseList(options));
	const reload = useCallback(() => setCannedList(new CannedResponseList(options)), [options]);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	useEffect(() => {
		if (cannedList.options !== options) {
			cannedList.updateFilters(options);
		}
	}, [cannedList, options]);

	const getCannedResponses = useEndpoint('GET', 'canned-responses');
	const getDepartments = useEndpoint('GET', 'livechat/department');

	const fetchData = useCallback(
		async (start, end) => {
			const { cannedResponses, total } = await getCannedResponses({
				...(options.filter && { shortcut: options.filter }),
				...(options.type &&
					['global', 'user'].find((option) => option === options.type) && { scope: options.type }),
				...(options.type &&
					!['global', 'user', 'all'].find((option) => option === options.type) && {
						departmentId: options.type,
					}),
				offset: start,
				count: end + start,
			});

			const { departments } = await getDepartments({ text: '' });

			return {
				items: cannedResponses.map((cannedResponse: any) => {
					if (cannedResponse.departmentId) {
						departments.forEach((department: any) => {
							if (cannedResponse.departmentId === department._id) {
								cannedResponse.departmentName = department.name;
							}
						});
					}
					cannedResponse._updatedAt = new Date(cannedResponse._updatedAt);
					cannedResponse._createdAt = new Date(cannedResponse._createdAt);
					return cannedResponse;
				}),
				itemCount: total,
			};
		},
		[getCannedResponses, getDepartments, options.filter, options.type],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(cannedList, fetchData);

	return {
		reload,
		cannedList,
		loadMoreItems,
		initialItemCount,
	};
};
