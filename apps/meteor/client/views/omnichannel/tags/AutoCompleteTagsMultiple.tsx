import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTagsList } from '../hooks/useTagsList';

type AutoCompleteTagsMultipleProps = Omit<
	ComponentProps<typeof PaginatedMultiSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem'
> & {
	department?: string;
	viewAll?: boolean;
};

const AutoCompleteTagsMultiple = ({
	value = [],
	onChange = () => undefined,
	department,
	viewAll = false,
	placeholder,
	...props
}: AutoCompleteTagsMultipleProps) => {
	const { t } = useTranslation();
	const [tagsFilter, setTagsFilter] = useState('');

	const debouncedTagsFilter = useDebouncedValue(tagsFilter, 500);

	const { data: tagsItems, fetchNextPage } = useTagsList({
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
			withTitle
			{...props}
			value={value}
			onChange={onChange}
			filter={tagsFilter}
			setFilter={setTagsFilter}
			options={tagsOptions}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			placeholder={placeholder ?? t('Select_an_option')}
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteTagsMultiple);
