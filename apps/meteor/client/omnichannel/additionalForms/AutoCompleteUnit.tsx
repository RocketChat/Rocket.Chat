import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUnitsList } from '../../components/Omnichannel/hooks/useUnitsList';
import { useRecordList } from '../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../lib/asyncState';

type AutoCompleteUnitProps = {
	value: string | undefined;
	error?: string;
	placeholder?: string;
	haveNoUnitSelectedOption?: boolean;
	onChange: (value: string) => void;
};

const AutoCompleteUnit = ({ value, error, placeholder, haveNoUnitSelectedOption, onChange }: AutoCompleteUnitProps) => {
	const { t } = useTranslation();
	const [unitsFilter, setUnitsFilter] = useState<string>('');

	const debouncedUnitFilter = useDebouncedValue(unitsFilter, 500);

	const { itemsList, loadMoreItems: loadMoreUnits } = useUnitsList(
		useMemo(() => ({ text: debouncedUnitFilter, haveNoUnitSelectedOption }), [debouncedUnitFilter, haveNoUnitSelectedOption]),
	);
	const { phase: agentsPhase, itemCount: agentsTotal, items: unitsList } = useRecordList(itemsList);

	return (
		<PaginatedSelectFiltered
			data-qa='autocomplete-unit'
			error={error}
			filter={unitsFilter}
			flexGrow={0}
			flexShrink={0}
			onChange={onChange}
			options={unitsList}
			placeholder={placeholder || t('Select_an_option')}
			setFilter={setUnitsFilter as (value: string | number | undefined) => void}
			value={value}
			width='100%'
			endReached={
				agentsPhase === AsyncStatePhase.LOADING ? (): void => undefined : (start): void => loadMoreUnits(start, Math.min(50, agentsTotal))
			}
		/>
	);
};

export default AutoCompleteUnit;
