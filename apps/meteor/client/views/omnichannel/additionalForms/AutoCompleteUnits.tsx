import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUnitsList } from '../hooks/useUnitsList';

type AutoCompleteUnitsProps = Omit<
	ComponentProps<typeof PaginatedMultiSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem'
>;

const AutoCompleteUnits = ({ value, placeholder, onChange, ...props }: AutoCompleteUnitsProps): ReactElement => {
	const { t } = useTranslation();
	const [unitsFilter, setUnitsFilter] = useState<string>('');
	const debouncedUnitFilter = useDebouncedValue(unitsFilter, 500);

	const { data: unitItems, fetchNextPage } = useUnitsList({ filter: debouncedUnitFilter });

	return (
		<PaginatedMultiSelectFiltered
			{...props}
			value={value}
			placeholder={placeholder || t('Select_an_option')}
			filter={unitsFilter}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			setFilter={setUnitsFilter as (value: string | number | undefined) => void}
			options={unitItems}
			onChange={onChange}
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteUnits);
