import { useCallback, useState } from 'react';

import { useEndpoint } from '../../../client/contexts/ServerContext';
import { useScrollableRecordList } from '../../../client/hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../client/hooks/useComponentDidUpdate';
import { RecordList } from '../../../client/lib/lists/RecordList';

type TagsListOptions = {
	filter: string;
};

type PaginatedOptionType = {
	_id: string;
	_updatedAt: Date;
	value: string | number;
	label: string;
};

export const useTagsList = (
	options: TagsListOptions,
): {
	itemsList: RecordList<PaginatedOptionType>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new RecordList<PaginatedOptionType>());
	const reload = useCallback(() => setItemsList(new RecordList<PaginatedOptionType>()), []);

	const getTags = useEndpoint('GET', 'livechat/tags.list');

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { tags, total } = await getTags({
				text: options.filter,
				offset: start,
				count: end + start,
			});
			return {
				items: tags.map((tag) => ({ _id: tag._id, label: tag.name, value: tag._id, _updatedAt: new Date() })),
				itemCount: total,
			};
		},
		[getTags, options.filter],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
