import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
	DiscussionsList,
	DiscussionsListOptions,
} from '../../../../lib/lists/DiscussionsList';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { useScrollableMessageList } from '../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../hooks/lists/useStreamUpdatesForMessageList';
import { IUser } from '../../../../../definition/IUser';
import { getConfig } from '../../../../../app/ui-utils/client/config';

export const useDiscussionsList = (
	options: DiscussionsListOptions,
	uid: IUser['_id'],
): {
		discussionsList: DiscussionsList;
		totalItemCount: number;
		initialItemCount: number;
		loadMoreItems: (start: number, end: number) => void;
	} => {
	const [discussionsList] = useState(() => new DiscussionsList(options));
	const [totalItemCount, setTotalItemCount] = useSafely(useState(0));

	useEffect(() => {
		if (discussionsList.options !== options) {
			discussionsList.updateFilters(options);
		}
	}, [discussionsList, options]);

	const getDiscussions = useEndpoint('GET', 'chat.getDiscussions');

	const fetchMessages = useCallback(
		async (start, end) => {
			const { messages, total } = await getDiscussions({
				roomId: options.rid,
				text: options.text,
				offset: start,
				count: end - start,
			});

			setTotalItemCount(total);

			return messages;
		},
		[getDiscussions, options.rid, options.text, setTotalItemCount],
	);

	const { loadMoreItems, initialItemCount } = useScrollableMessageList(
		discussionsList,
		fetchMessages,
		useMemo(() => parseInt(getConfig('discussionListSize'), 10), []),
	);
	useStreamUpdatesForMessageList(discussionsList, uid, options.rid);

	return {
		discussionsList,
		totalItemCount,
		loadMoreItems,
		initialItemCount,
	};
};
