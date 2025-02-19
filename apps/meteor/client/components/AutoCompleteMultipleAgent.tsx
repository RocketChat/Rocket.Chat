import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../lib/asyncState';
import { useAgentsList } from './Omnichannel/hooks/useAgentsList';

type AutoCompleteMultipleAgentProps = {
	value: PaginatedMultiSelectOption[];
	error?: boolean;
	placeholder?: string;
	excludeId?: string;
	showIdleAgents?: boolean;
	onlyAvailable?: boolean;
	withTitle?: boolean;
	onChange: (value: PaginatedMultiSelectOption[]) => void;
};

const AutoCompleteMultipleAgent = ({
	value,
	error,
	placeholder,
	excludeId,
	showIdleAgents = true,
	onlyAvailable = false,
	withTitle = false,
	onChange,
}: AutoCompleteMultipleAgentProps): ReactElement => {
	const [agentsFilter, setAgentsFilter] = useState<string>('');

	const debouncedAgentsFilter = useDebouncedValue(agentsFilter, 500);

	const { itemsList: AgentsList, loadMoreItems: loadMoreAgents } = useAgentsList(
		useMemo(
			() => ({ text: debouncedAgentsFilter, onlyAvailable, excludeId, showIdleAgents }),
			[debouncedAgentsFilter, excludeId, onlyAvailable, showIdleAgents],
		),
	);

	const { phase: agentsPhase, itemCount: agentsTotal, items: agentsItems } = useRecordList(AgentsList);

	return (
		<PaginatedMultiSelectFiltered
			withTitle={withTitle}
			value={value}
			error={error}
			placeholder={placeholder}
			onChange={onChange}
			width='100%'
			flexShrink={0}
			flexGrow={0}
			filter={agentsFilter}
			setFilter={setAgentsFilter as (value: string | number | undefined) => void}
			options={agentsItems}
			data-qa='autocomplete-multiple-agent'
			endReached={
				agentsPhase === AsyncStatePhase.LOADING ? (): void => undefined : (start): void => loadMoreAgents(start!, Math.min(50, agentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteMultipleAgent);
