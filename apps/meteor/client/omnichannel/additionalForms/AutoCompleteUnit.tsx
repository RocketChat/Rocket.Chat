import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UnitOption } from '../../components/Omnichannel/hooks/useUnitsList';
import { useUnitsList } from '../../components/Omnichannel/hooks/useUnitsList';

type AutoCompleteUnitProps = Omit<
	ComponentProps<typeof PaginatedSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem'
> & {
	haveNone?: boolean;
	value: string | undefined;
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

	const { data: unitsList, fetchNextPage } = useUnitsList({ filter: debouncedUnitFilter, haveNone });

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
