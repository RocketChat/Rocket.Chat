import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useInfiniteTagsList } from '../../components/Omnichannel/hooks/useInfiniteTagsList';

type AutoCompleteTagsMultipleProps = {
	id?: string;
	value?: PaginatedMultiSelectOption[];
	onChange?: (value: PaginatedMultiSelectOption[]) => void;
	department?: string;
	viewAll?: boolean;
};

const AutoCompleteTagsMultiple = ({
	id,
	value = [],
	onChange = () => undefined,
	department,
	viewAll = false,
}: AutoCompleteTagsMultipleProps) => {
	const { t } = useTranslation();
	const [tagsFilter, setTagsFilter] = useState('');

	const debouncedTagsFilter = useDebouncedValue(tagsFilter, 500);

	const { data: tagsItems = [], fetchNextPage } = useInfiniteTagsList({
		filter: debouncedTagsFilter,
		department,
		viewAll,
	});

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
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteTagsMultiple);
