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

	const fetchData = useCallback(
		async (start, end) => {
			const { cannedResponses, total } = await getCannedResponses({
				...(options.filter && { shortcut: options.filter }),
				...(options.type && options.type !== 'all' && { scope: options.type }),
				offset: start,
				count: end + start,
			});

			return {
				items: cannedResponses.map((cannedResponse: any) => {
					cannedResponse._updatedAt = new Date(cannedResponse._updatedAt);
					cannedResponse._createdAt = new Date(cannedResponse._createdAt);
					return cannedResponse;
				}),
				itemCount: total,
			};
		},
		[getCannedResponses, options.filter, options.type],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(cannedList, fetchData);

	return {
		reload,
		cannedList,
		loadMoreItems,
		initialItemCount,
	};
};
