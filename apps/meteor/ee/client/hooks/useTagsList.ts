import type { ILivechatTagRecord } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../../client/hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../client/hooks/useComponentDidUpdate';
import { RecordList } from '../../../client/lib/lists/RecordList';

type TagsListOptions = {
	filter: string;
};

export const useTagsList = (
	options: TagsListOptions,
): {
	itemsList: RecordList<ILivechatTagRecord>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatTagRecord>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatTagRecord>()), []);

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
				items: tags.map((tag: any) => {
					tag._updatedAt = new Date(tag._updatedAt);
					tag.label = tag.name;
					tag.value = { value: tag._id, label: tag.name };
					return tag;
				}),
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
