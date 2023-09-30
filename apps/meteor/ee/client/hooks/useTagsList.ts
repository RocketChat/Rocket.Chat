import type { ILivechatTagRecord } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../../client/hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../client/hooks/useComponentDidUpdate';
import { RecordList } from '../../../client/lib/lists/RecordList';

type TagsListOptions = {
	filter: string;
	department?: string;
	viewAll?: boolean;
};

type UseTagsListResult = {
	itemsList: RecordList<ILivechatTagRecord>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
};

export const useTagsList = (options: TagsListOptions): UseTagsListResult => {
	const { viewAll, department, filter } = options;
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatTagRecord>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatTagRecord>()), []);

	const getTags = useEndpoint('GET', '/v1/livechat/tags');

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { tags, total } = await getTags({
				text: filter,
				offset: start,
				count: end + start,
				...(viewAll && { viewAll: 'true' }),
				...(department && { department }),
			});

			return {
				items: tags.map<any>((tag: any) => ({
					_id: tag._id,
					label: tag.name,
					value: tag.name,
					_updatedAt: new Date(tag._updatedAt),
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
