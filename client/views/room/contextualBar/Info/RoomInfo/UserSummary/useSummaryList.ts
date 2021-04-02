import { useCallback, useEffect, useMemo, useState } from 'react';

import {
	UserSummaryList,
	UserSummaryListOptions,
} from '../../../../../../lib/lists/UserSummaryList';
import { useEndpoint } from '../../../../../../contexts/ServerContext';
import { useScrollableMessageList } from '../../../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../../../hooks/lists/useStreamUpdatesForMessageList';
import { IUser } from '../../../../../../../definition/IUser';
import { getConfig } from '../../../../../../../app/ui-utils/client/config';

export const useSummaryList = (
	options: UserSummaryListOptions,
	uid: IUser['_id'],
): {
		userSummaryList: UserSummaryList;
		initialItemCount: number;
		loadMoreItems: (start: number, end: number) => void;
	} => {
	const [userSummaryList] = useState(() => new UserSummaryList(options));

	useEffect(() => {
		if (userSummaryList.options !== options) {
			userSummaryList.updateFilters(options);
		}
	}, [userSummaryList, options]);

	const getSummaryList = useEndpoint('GET', 'chat.getSummaryList');

	const fetchMessages = useCallback(
		async (start, end) => {
			const { msg, total } = await getSummaryList({
				rid: options.rid,
				text: options.text,
				offset: start,
				count: end - start,
			});

			return {
				items: msg,
				itemCount: total,
			};
		},
		[getSummaryList, options.rid, options.text, options.type],
	);

	const { loadMoreItems, initialItemCount } = useScrollableMessageList(
		userSummaryList,
		fetchMessages,
		useMemo(() => {
			const summaryListSize = getConfig('summaryListSize');
			return summaryListSize ? parseInt(summaryListSize, 10) : undefined;
		}, []),
	);
	useStreamUpdatesForMessageList(userSummaryList, uid, options.rid);

	return {
		userSummaryList,
		loadMoreItems,
		initialItemCount,
	};
};
