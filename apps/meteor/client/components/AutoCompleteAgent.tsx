import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useState } from 'react';

import { useAgentsList } from './Omnichannel/hooks/useAgentsList';

type AutoCompleteAgentProps = Omit<
	ComponentProps<typeof PaginatedSelectFiltered>,
	'filter' | 'setFilter' | 'options' | 'endReached' | 'renderItem'
> & {
	value: string;
	haveAll?: boolean;
	haveNoAgentsSelectedOption?: boolean;
	excludeId?: string;
	showIdleAgents?: boolean;
	onlyAvailable?: boolean;
	onChange: (value: string) => void;
};

const AutoCompleteAgent = ({
	value,
	haveAll = false,
	haveNoAgentsSelectedOption = false,
	excludeId,
	showIdleAgents = true,
	onlyAvailable = false,
	onChange,
	...props
}: AutoCompleteAgentProps): ReactElement => {
	const [agentsFilter, setAgentsFilter] = useState<string>('');
	const debouncedAgentsFilter = useDebouncedValue(agentsFilter, 500);

	const { data: agentsItems, fetchNextPage } = useAgentsList({
		filter: debouncedAgentsFilter,
		onlyAvailable,
		haveAll,
		haveNoAgentsSelectedOption,
		excludeId,
		showIdleAgents,
	});

	return (
		<PaginatedSelectFiltered
			{...props}
			value={value}
			flexShrink={0}
			filter={agentsFilter}
			setFilter={setAgentsFilter as (value: string | number | undefined) => void}
			options={agentsItems}
			data-qa='autocomplete-agent'
			onChange={onChange}
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteAgent);
