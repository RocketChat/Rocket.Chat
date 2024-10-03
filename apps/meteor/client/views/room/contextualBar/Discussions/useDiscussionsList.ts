import type { IUser } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import { useScrollableMessageList } from '../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../hooks/lists/useStreamUpdatesForMessageList';
import type { DiscussionsListOptions } from '../../../../lib/lists/DiscussionsList';
import { DiscussionsList } from '../../../../lib/lists/DiscussionsList';
import { getConfig } from '../../../../lib/utils/getConfig';

export const useDiscussionsList = (
	options: DiscussionsListOptions,
	uid: IUser['_id'] | null,
): {
	discussionsList: DiscussionsList;
	initialItemCount: number;
	loadMoreItems: (start: number, end: number) => void;
} => {
	if (!uid) {
		throw new Error('User ID is undefined. Cannot load discussions list');
	}

	const discussionsList = useMemo(() => new DiscussionsList(options), [options]);

	const getDiscussions = useEndpoint('GET', '/v1/chat.getDiscussions');

	const fetchMessages = useCallback(
		async (start: number, end: number) => {
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
		useMemo(() => parseInt(`${getConfig('discussionListSize', 10)}`), []),
	);
	useStreamUpdatesForMessageList(discussionsList, uid, options.rid);

	return {
		discussionsList,
		loadMoreItems,
		initialItemCount,
	};
};
