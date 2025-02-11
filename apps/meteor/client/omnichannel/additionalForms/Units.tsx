import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';

import { useUnits } from '../../components/Omnichannel/hooks/useUnits';
import { useRecordList } from '../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../lib/asyncState';

type AutoCompleteUnitsProps = {
	value?: PaginatedMultiSelectOption[];
	error?: boolean;
	placeholder?: string;
	onChange: (value: PaginatedMultiSelectOption[]) => void;
};

const AutoCompleteUnits = ({ value, error, placeholder, onChange }: AutoCompleteUnitsProps): ReactElement => {
	const [agentsFilter, setAgentsFilter] = useState<string>('');

	const debouncedUnitFilter = useDebouncedValue(agentsFilter, 500);

	const { itemsList: UnitsList, loadMoreItems: loadMoreUnits } = useUnits(
		useMemo(() => ({ text: debouncedUnitFilter }), [debouncedUnitFilter]),
	);

	const { phase: agentsPhase, itemCount: agentsTotal, items: unitItems } = useRecordList(UnitsList);

	return (
		<PaginatedMultiSelectFiltered
			value={value}
			error={error}
			placeholder={placeholder}
			onChange={onChange}
			flexShrink={0}
			filter={agentsFilter}
			setFilter={setAgentsFilter as (value: string | number | undefined) => void}
			options={unitItems}
			data-qa='autocomplete-multiple-unit'
			endReached={
				agentsPhase === AsyncStatePhase.LOADING ? (): void => undefined : (start): void => loadMoreUnits(start!, Math.min(50, agentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteUnits);
