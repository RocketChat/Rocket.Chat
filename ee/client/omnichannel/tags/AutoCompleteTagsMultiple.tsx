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

const AutoCompleteTagsMultiple = ({ value, onChange }: AutoCompleteTagsMultiplePropsType): ReactElement => {
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

	const options = sortedByName.map((value) => ({ value: value._id, label: value.name }));

	return (
		<PaginatedMultiSelectFiltered
			withTitle
			value={value}
			onChange={onChange}
			filter={tagsFilter}
			setFilter={setTagsFilter}
			options={options}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			placeholder={t('Select_an_option')}
			endReached={
				tagsPhase === AsyncStatePhase.LOADING
					? (): void => undefined
					: (start: number): void => loadMoreTags(start, Math.min(50, tagsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteTagsMultiple);
