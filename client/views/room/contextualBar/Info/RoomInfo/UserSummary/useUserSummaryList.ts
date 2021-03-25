import { useCallback, useEffect, useMemo, useState } from 'react';

import {
	UserMessageList,
	UserMessageListOptions,
} from '../../../../../../lib/lists/UserSummaryList';
import { useEndpoint } from '../../../../../../contexts/ServerContext';
import { useScrollableMessageList } from '../../../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../../../hooks/lists/useStreamUpdatesForMessageList';
import { IUser } from '../../../../../../../definition/IUser';
import { getConfig } from '../../../../../../../app/ui-utils/client/config';

export const useUserSummaryList = (
	options: UserMessageListOptions,
	uid: IUser['_id'],
): {
        userMessageList: UserMessageList;
		initialItemCount: number;
		loadMoreItems: (start: number, end: number) => void;
	} => {
	const [userMessageList] = useState(() => new UserMessageList(options));

	useEffect(() => {
		if (userMessageList.options !== options) {
			userMessageList.updateFilters(options);
		}
	}, [userMessageList, options]);

	const getDiscussions = useEndpoint('GET', 'chat.getUserSummary');

	const fetchMessages = useCallback(
		async (start, end) => {
			const { messages, total } = await getDiscussions({
				roomId: options.rid,
				text: options.text,
				offset: start,
				count: end - start,
			});

			return {
				items: messages,
				itemCount: total,
			};
		},
		[getDiscussions, options.rid, options.text],
	);

	const { loadMoreItems, initialItemCount } = useScrollableMessageList(
		userMessageList,
		fetchMessages,
		useMemo(() => {
			const discussionListSize = getConfig('discussionListSize');
			return discussionListSize ? parseInt(discussionListSize, 10) : undefined;
		}, []),
	);
	useStreamUpdatesForMessageList(userMessageList, uid, options.rid);

	return {
		userMessageList,
		loadMoreItems,
		initialItemCount,
	};
};
