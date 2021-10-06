import { useCallback, useMemo } from 'react';

import { IUser } from '../../../../../definition/IUser';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { useScrollableMessageList } from '../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../hooks/lists/useStreamUpdatesForMessageList';
import { DiscussionsList, DiscussionsListOptions } from '../../../../lib/lists/DiscussionsList';
import { getConfig } from '../../../../lib/utils/getConfig';

export const useDiscussionsList = (
	options: DiscussionsListOptions,
	uid: IUser['_id'],
): {
	discussionsList: DiscussionsList;
	initialItemCount: number;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const discussionsList = useMemo(() => new DiscussionsList(options), [options]);

	const getDiscussions = useEndpoint('GET', 'chat.getDiscussions');

	const fetchMessages = useCallback(
		async (start, end) => {
			const { messages, total } = await getDiscussions({
				roomId: options.rid,
				text: options.text,
				offset: start,
				count: end,
			});

			return {
				items: messages,
				itemCount: total,
			};
		},
		[getDiscussions, options.rid, options.text],
	);

	const { loadMoreItems, initialItemCount } = useScrollableMessageList(
		discussionsList,
		fetchMessages,
		useMemo(() => {
			const discussionListSize = getConfig('discussionListSize');
			return discussionListSize ? parseInt(discussionListSize, 10) : undefined;
		}, []),
	);
	useStreamUpdatesForMessageList(discussionsList, uid, options.rid);

	return {
		discussionsList,
		loadMoreItems,
		initialItemCount,
	};
};
