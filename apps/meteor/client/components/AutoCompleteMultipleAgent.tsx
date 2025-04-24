import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { memo, useState } from 'react';

import { useInfiniteAgentsList } from './Omnichannel/hooks/useInfiniteAgentsList';

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

	const { data: agentsItems = [], fetchNextPage } = useInfiniteAgentsList({
		text: debouncedAgentsFilter,
		onlyAvailable,
		excludeId,
		showIdleAgents,
	});

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
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteMultipleAgent);
