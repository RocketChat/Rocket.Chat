import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRecordList } from '../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../hooks/useAsyncState';
import { useTagsList } from '../../hooks/useTagsList';

type AutoCompleteTagsMultipleProps = {
	id?: string;
	value?: PaginatedMultiSelectOption[];
	onlyMyTags?: boolean;
	onChange?: (value: PaginatedMultiSelectOption[]) => void;
	department?: string;
	viewAll?: boolean;
};

const AutoCompleteTagsMultiple = ({
	id,
	value = [],
	onlyMyTags = false,
	onChange = () => undefined,
	department,
	viewAll = false,
}: AutoCompleteTagsMultipleProps) => {
	const { t } = useTranslation();
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
			id={id}
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
			endReached={
				tagsPhase === AsyncStatePhase.LOADING ? () => undefined : (start) => start && loadMoreTags(start, Math.min(50, tagsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteTagsMultiple);
