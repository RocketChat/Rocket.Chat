import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo, useState } from 'react';

import { useRecordList } from '../../../../client/hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useTagsList } from '../../hooks/useTagsList';

const AutoCompleteTagMultiple = (props) => {
	const { value, onlyMyTags = false, onChange = () => {}, department, viewAll = false } = props;

	const t = useTranslation();
	const [tagsFilter, setTagsFilter] = useState('');

	const debouncedTagsFilter = useDebouncedValue(tagsFilter, 500);

	const { itemsList: tagsList, loadMoreItems: loadMoreTags } = useTagsList(
		useMemo(
			() => ({ filter: debouncedTagsFilter, onlyMyTags, department, viewAll }),
			[debouncedTagsFilter, onlyMyTags, department, viewAll],
		),
	);

	const { phase: tagsPhase, items: tagsItems, itemCount: tagsTotal } = useRecordList(tagsList);

	const tagsOptions = useMemo(() => {
		const pending = value.filter(({ value }) => !tagsItems.find((tag) => tag.value === value));
		return [...tagsItems, ...pending];
	}, [tagsItems, value]);

	return (
		<PaginatedMultiSelectFiltered
			withTitle
			value={value}
			onChange={onChange}
			filter={tagsFilter}
			setFilter={setTagsFilter}
			options={tagsOptions}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			placeholder={t('Select_an_option')}
			endReached={tagsPhase === AsyncStatePhase.LOADING ? () => {} : (start) => loadMoreTags(start, Math.min(50, tagsTotal))}
		/>
	);
};

export default memo(AutoCompleteTagMultiple);
