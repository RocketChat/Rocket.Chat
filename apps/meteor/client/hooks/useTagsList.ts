import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from './lists/useScrollableRecordList';
import { useComponentDidUpdate } from './useComponentDidUpdate';
import { RecordList } from '../lib/lists/RecordList';

type TagsListOptions = {
	filter: string;
	department?: string;
	viewAll?: boolean;
};

type TagListItem = { _id: string; label: string; value: string; _updatedAt: Date };

type UseTagsListResult = {
	itemsList: RecordList<TagListItem>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
};

export const useTagsList = (options: TagsListOptions): UseTagsListResult => {
	const { viewAll, department, filter } = options;
	const [itemsList, setItemsList] = useState(() => new RecordList<TagListItem>());
	const reload = useCallback(() => setItemsList(new RecordList<TagListItem>()), []);

	const getTags = useEndpoint('GET', '/v1/livechat/tags');

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start: number, end: number) => {
			const { tags, total } = await getTags({
				text: filter,
				offset: start,
				count: end + start,
				...(viewAll && { viewAll: 'true' }),
				...(department && { department }),
				sort: JSON.stringify({ name: 1 }),
			});

			return {
				items: tags.map<any>((tag: any) => ({
					_id: tag._id,
					label: tag.name,
					value: tag.name,
				})),
				itemCount: total,
			};
		},
		[getTags, filter, viewAll, department],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
