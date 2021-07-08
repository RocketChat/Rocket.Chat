import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useMemo, useState } from 'react';

import { useRecordList } from '../../../../client/hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useTagsList } from '../../hooks/useTagsList';

const AutoCompleteTag = (props) => {
	const { value, onChange = () => {}, haveAll = false } = props;
	const [tagsFilter, setTagsFilter] = useState('');

	const debouncedTagsFilter = useDebouncedValue(tagsFilter, 500);

	const { itemsList: TagsList, loadMoreItems: loadMoreTags } = useTagsList(
		useMemo(() => ({ text: debouncedTagsFilter, haveAll }), [debouncedTagsFilter, haveAll]),
	);

	const { phase: tagsPhase, items: tagsItems, itemCount: tagsTotal } = useRecordList(TagsList);

	const sortedByName = tagsItems.sort((a, b) => {
		if (a.value === 'all') {
			return -1;
		}

		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}

		return 0;
	});

	return (
		<PaginatedSelectFiltered
			value={value}
			onChange={onChange}
			flexShrink={0}
			filter={tagsFilter}
			setFilter={setTagsFilter}
			options={sortedByName}
			endReached={
				tagsPhase === AsyncStatePhase.LOADING
					? () => {}
					: (start) => loadMoreTags(start, Math.min(50, tagsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteTag);
