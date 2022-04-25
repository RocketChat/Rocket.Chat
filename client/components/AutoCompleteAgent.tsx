import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useMemo, useState, ReactElement, forwardRef } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../lib/asyncState';
import { useAgentsList } from './Omnichannel/hooks/useAgentsList';

type AutoCompleteAgentProps = {
	value: string;
	onChange: (value: string) => void;
	haveAll: boolean;
	name?: string;
	onBlur?: () => void;
};

const AutoCompleteAgent = forwardRef(function AutoCompleteAgent({
	value,
	onChange = (): void => undefined,
	haveAll = false,
	onBlur,
	name,
}: AutoCompleteAgentProps): // ref,
ReactElement {
	const [agentsFilter, setAgentsFilter] = useState('');

	const debouncedAgentsFilter = useDebouncedValue(agentsFilter, 500);

	const { itemsList: AgentsList, loadMoreItems: loadMoreAgents } = useAgentsList(
		useMemo(() => ({ text: debouncedAgentsFilter, haveAll }), [debouncedAgentsFilter, haveAll]),
	);

	const { phase: agentsPhase, items: agentsItems, itemCount: agentsTotal } = useRecordList(AgentsList);

	const sortedByName = agentsItems.sort((a, b) => {
		if (a.value === 'all') {
			return -1;
		}

		if (a.label > b.label) {
			return 1;
		}

		if (a.label < b.label) {
			return -1;
		}

		return 0;
	});

	return (
		<PaginatedSelectFiltered
			value={value}
			onChange={onChange}
			flexShrink={0}
			filter={agentsFilter}
			setFilter={setAgentsFilter as (value: string | number | undefined) => void}
			options={sortedByName}
			endReached={
				agentsPhase === AsyncStatePhase.LOADING ? (): void => undefined : (start): void => loadMoreAgents(start, Math.min(50, agentsTotal))
			}
			onBlur={onBlur}
			name={name}
		/>
	);
});

export default memo(AutoCompleteAgent);
