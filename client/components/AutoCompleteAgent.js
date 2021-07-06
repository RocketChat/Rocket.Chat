import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useMemo, useState } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../lib/asyncState';
import { useAgentsList } from './Omnichannel/hooks/useAgentsList';

const AutoCompleteAgent = (props) => {
	const { value, onChange = () => {}, haveAll = false } = props;
	const [agentsFilter, setAgentsFilter] = useState('');

	const debouncedAgentsFilter = useDebouncedValue(agentsFilter, 500);

	const { itemsList: AgentsList, loadMoreItems: loadMoreAgents } = useAgentsList(
		useMemo(() => ({ text: debouncedAgentsFilter, haveAll }), [debouncedAgentsFilter, haveAll]),
	);

	const {
		phase: agentsPhase,
		items: agentsItems,
		itemCount: agentsTotal,
	} = useRecordList(AgentsList);

	const sortedByName = agentsItems.sort((a, b) => {
		if (a.value === 'all') {
			return -1;
		}

		if (a.usename > b.usename) {
			return 1;
		}
		if (a.usename < b.usename) {
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
			setFilter={setAgentsFilter}
			options={sortedByName}
			endReached={
				agentsPhase === AsyncStatePhase.LOADING
					? () => {}
					: (start) => loadMoreAgents(start, Math.min(50, agentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteAgent);
