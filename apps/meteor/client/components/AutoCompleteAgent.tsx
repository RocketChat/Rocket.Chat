import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../lib/asyncState';
import { useAgentsList } from './Omnichannel/hooks/useAgentsList';

type AutoCompleteAgentProps = {
	value: string;
	onChange: (value: string) => void;
	haveAll?: boolean;
	haveNoAgentsSelectedOption?: boolean;
};
const AutoCompleteAgent = ({
	value,
	onChange,
	haveAll = false,
	haveNoAgentsSelectedOption = false,
}: AutoCompleteAgentProps): ReactElement => {
	const [agentsFilter, setAgentsFilter] = useState<string>('');

	const debouncedAgentsFilter = useDebouncedValue(agentsFilter, 500);

	const { itemsList: AgentsList, loadMoreItems: loadMoreAgents } = useAgentsList(
		useMemo(
			() => ({ text: debouncedAgentsFilter, haveAll, haveNoAgentsSelectedOption }),
			[debouncedAgentsFilter, haveAll, haveNoAgentsSelectedOption],
		),
	);

	const { phase: agentsPhase, itemCount: agentsTotal, items: agentsItems } = useRecordList(AgentsList);

	const sortedByName = agentsItems.sort((a, b) => {
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
			data-qa='autocomplete-agent'
			endReached={
				agentsPhase === AsyncStatePhase.LOADING ? (): void => undefined : (start): void => loadMoreAgents(start, Math.min(50, agentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteAgent);
