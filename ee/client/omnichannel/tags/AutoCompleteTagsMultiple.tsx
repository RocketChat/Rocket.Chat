import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, memo, useMemo, useState } from 'react';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRecordList } from '../../../../client/hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useTagsList } from '../../hooks/useTagsList';

type AutoCompleteTagsMultiplePropsType = {
	value: Array<string>;
	onChange: () => {};
};

const AutoCompleteTagMultiple = ({ value, onChange }: AutoCompleteTagsMultiplePropsType): ReactElement => {
	const onlyMyTags = false;

	const t = useTranslation();
	const [tagsFilter, setTagsFilter] = useState('');

	const debouncedTagsFilter = useDebouncedValue(tagsFilter, 500);

	const { itemsList: tagsList, loadMoreItems: loadMoreTags } = useTagsList(
		useMemo(() => ({ filter: debouncedTagsFilter, onlyMyTags }), [debouncedTagsFilter, onlyMyTags]),
	);

	const { phase: tagsPhase, items: tagsItems, itemCount: tagsTotal } = useRecordList(tagsList);

	const sortedByName = tagsItems.sort((a, b) => {
		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}

		return 0;
	});

	return (
		<PaginatedMultiSelectFiltered
			withTitle
			value={value}
			onChange={onChange}
			filter={tagsFilter}
			setFilter={setTagsFilter}
			options={sortedByName}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			placeholder={t('Select_an_option')}
			endReached={
				tagsPhase === AsyncStatePhase.LOADING ? (): {} => ({}) : (start: number): void => loadMoreTags(start, Math.min(50, tagsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteTagMultiple);
