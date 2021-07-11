import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import React, { useMemo, useState } from 'react';

import { useRecordList } from '../../../../client/hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useTagsList } from '../../hooks/useTagsList';

const CurrentChatTags = ({ value, handler }) => {
	const [tagsFilter, setTagsFilter] = useState('');

	const { itemsList: tagsList, loadMoreItems: loadMoreTags } = useTagsList(
		useMemo(() => ({ filter: tagsFilter }), [tagsFilter]),
	);

	const { phase: tagsPhase, items: tagsItems, itemCount: tagsTotal } = useRecordList(tagsList);

	return (
		<PaginatedMultiSelectFiltered
			maxWidth={'100%'}
			flexGrow={1}
			filter={tagsFilter}
			setFilter={setTagsFilter}
			onChange={handler}
			options={tagsItems}
			value={value}
			endReached={
				tagsPhase === AsyncStatePhase.LOADING
					? () => {}
					: (start) => loadMoreTags(start, Math.min(50, tagsTotal))
			}
		/>
	);
};

export default CurrentChatTags;
