import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useInfiniteUnitsList } from '../../components/Omnichannel/hooks/useInfiniteUnitsList';

type AutoCompleteUnitsProps = {
	value?: PaginatedMultiSelectOption[];
	error?: boolean;
	placeholder?: string;
	onChange: (value: PaginatedMultiSelectOption[]) => void;
};

const AutoCompleteUnits = ({ value, error, placeholder, onChange }: AutoCompleteUnitsProps): ReactElement => {
	const { t } = useTranslation();
	const [unitsFilter, setUnitsFilter] = useState<string>('');

	const debouncedUnitFilter = useDebouncedValue(unitsFilter, 500);

	const { data: unitItems = [], fetchNextPage } = useInfiniteUnitsList({ text: debouncedUnitFilter });

	return (
		<PaginatedMultiSelectFiltered
			value={value}
			error={error}
			placeholder={placeholder || t('Select_an_option')}
			onChange={onChange}
			filter={unitsFilter}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			setFilter={setUnitsFilter as (value: string | number | undefined) => void}
			options={unitItems}
			data-qa='autocomplete-multiple-unit'
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteUnits);
