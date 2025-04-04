import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UnitOption } from '../../components/Omnichannel/hooks/useUnitsList';
import { useUnitsList } from '../../components/Omnichannel/hooks/useUnitsList';
import { useRecordList } from '../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../lib/asyncState';
import type { RecordList } from '../../lib/lists/RecordList';

type AutoCompleteUnitProps = {
	id?: string;
	disabled?: boolean;
	value: string | undefined;
	error?: string;
	placeholder?: string;
	haveNone?: boolean;
	onChange: (value: string) => void;
	onLoadItems?: (list: RecordList<UnitOption>) => void;
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

	const { itemsList, loadMoreItems: loadMoreUnits } = useUnitsList(
		useMemo(() => ({ text: debouncedUnitFilter, haveNone }), [debouncedUnitFilter, haveNone]),
	);
	const { phase: unitsPhase, itemCount: unitsTotal, items: unitsList } = useRecordList(itemsList);

	const handleLoadItems = useEffectEvent(onLoadItems);

	useEffect(() => {
		handleLoadItems(itemsList);
	}, [handleLoadItems, unitsTotal, itemsList]);

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
			endReached={
				unitsPhase === AsyncStatePhase.LOADING ? (): void => undefined : (start): void => loadMoreUnits(start, Math.min(50, unitsTotal))
			}
		/>
	);
};

export default AutoCompleteUnit;
