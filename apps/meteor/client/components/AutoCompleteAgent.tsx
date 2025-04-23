import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { AriaAttributes, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';

import { useInfiniteAgentsList } from './Omnichannel/hooks/useInfiniteAgentsList';

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

	useMemo(
		() => ({ text: debouncedAgentsFilter, onlyAvailable, haveAll, haveNoAgentsSelectedOption, excludeId, showIdleAgents }),
		[debouncedAgentsFilter, excludeId, haveAll, haveNoAgentsSelectedOption, onlyAvailable, showIdleAgents],
	);

	const { data: agentsItems = [], fetchNextPage } = useInfiniteAgentsList({
		text: debouncedAgentsFilter,
		onlyAvailable,
		haveAll,
		haveNoAgentsSelectedOption,
		excludeId,
		showIdleAgents,
	});

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
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteAgent);
