import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo, useState } from 'react';

import { useRecordList } from '../../../../client/hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useTagsList } from '../../hooks/useTagsList';

type AutoCompleteTagsMultipleProps = {
	value?: PaginatedMultiSelectOption[];
	onlyMyTags?: boolean;
	onChange?: (value: PaginatedMultiSelectOption[]) => void;
	department?: string;
	viewAll?: boolean;
};

const AutoCompleteTagsMultiple = ({
	value,
	onlyMyTags = false,
	onChange = () => undefined,
	department,
	viewAll = false,
}: AutoCompleteTagsMultipleProps) => {
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

	const sortedByName = tagsItems.sort((a, b) => {
		if (a?.label && b?.label) {
			return a.label.localeCompare(b.label);
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
				tagsPhase === AsyncStatePhase.LOADING ? () => undefined : (start) => start && loadMoreTags(start, Math.min(50, tagsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteTagsMultiple);
