import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useInfiniteUnitsList } from '../../components/Omnichannel/hooks/useInfiniteUnitsList';
import type { UnitOption } from '../../components/Omnichannel/hooks/useUnitsList';

type AutoCompleteUnitProps = {
	id?: string;
	disabled?: boolean;
	value: string | undefined;
	error?: string;
	placeholder?: string;
	haveNone?: boolean;
	onChange: (value: string) => void;
	onLoadItems?: (list: UnitOption[]) => void;
};

const AutoCompleteUnit = ({
	id,
	value,
	disabled = false,
	error,
	placeholder,
	haveNone,
	onChange,
	onLoadItems = () => undefined,
}: AutoCompleteUnitProps) => {
	const { t } = useTranslation();
	const [unitsFilter, setUnitsFilter] = useState<string>('');

	const debouncedUnitFilter = useDebouncedValue(unitsFilter, 500);

	const { data: unitsList = [], fetchNextPage } = useInfiniteUnitsList({ text: debouncedUnitFilter, haveNone });

	const handleLoadItems = useEffectEvent(onLoadItems);

	useEffect(() => {
		handleLoadItems(unitsList);
	}, [handleLoadItems, unitsList]);

	return (
		<PaginatedSelectFiltered
			id={id}
			data-qa='autocomplete-unit'
			error={error}
			filter={unitsFilter}
			flexGrow={0}
			flexShrink={0}
			disabled={disabled}
			onChange={onChange}
			options={unitsList}
			placeholder={placeholder || t('Select_an_option')}
			setFilter={setUnitsFilter as (value: string | number | undefined) => void}
			value={value}
			width='100%'
			endReached={() => fetchNextPage()}
		/>
	);
};

export default AutoCompleteUnit;
