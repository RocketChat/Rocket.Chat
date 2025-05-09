import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { AriaAttributes, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../lib/asyncState';
import { useAgentsList } from './Omnichannel/hooks/useAgentsList';

type AutoCompleteAgentProps = Pick<AriaAttributes, 'aria-labelledby'> & {
	value: string;
	error?: string;
	placeholder?: string;
	haveAll?: boolean;
	haveNoAgentsSelectedOption?: boolean;
	excludeId?: string;
	showIdleAgents?: boolean;
	onlyAvailable?: boolean;
	withTitle?: boolean;
	onChange: (value: string) => void;
};

const AutoCompleteAgent = ({
	value,
	error,
	placeholder,
	haveAll = false,
	haveNoAgentsSelectedOption = false,
	excludeId,
	showIdleAgents = true,
	onlyAvailable = false,
	withTitle = false,
	onChange,
	'aria-labelledby': ariaLabelledBy,
}: AutoCompleteAgentProps): ReactElement => {
	const [agentsFilter, setAgentsFilter] = useState<string>('');

	const debouncedAgentsFilter = useDebouncedValue(agentsFilter, 500);

	const { itemsList: AgentsList, loadMoreItems: loadMoreAgents } = useAgentsList(
		useMemo(
			() => ({ text: debouncedAgentsFilter, onlyAvailable, haveAll, haveNoAgentsSelectedOption, excludeId, showIdleAgents }),
			[debouncedAgentsFilter, excludeId, haveAll, haveNoAgentsSelectedOption, onlyAvailable, showIdleAgents],
		),
	);

	const { phase: agentsPhase, itemCount: agentsTotal, items: agentsItems } = useRecordList(AgentsList);

	return (
		<PaginatedSelectFiltered
			withTitle={withTitle}
			value={value}
			error={error}
			placeholder={placeholder}
			onChange={onChange}
			flexShrink={0}
			filter={agentsFilter}
			setFilter={setAgentsFilter as (value: string | number | undefined) => void}
			options={agentsItems}
			data-qa='autocomplete-agent'
			aria-labelledby={ariaLabelledBy}
			endReached={
				agentsPhase === AsyncStatePhase.LOADING ? (): void => undefined : (start): void => loadMoreAgents(start, Math.min(50, agentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteAgent);
