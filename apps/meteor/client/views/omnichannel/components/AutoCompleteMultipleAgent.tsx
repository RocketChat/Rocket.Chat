import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useState } from 'react';

import { useAgentsList } from '../hooks/useAgentsList';

type AutoCompleteMultipleAgentProps = Omit<
	ComponentProps<typeof PaginatedMultiSelectFiltered>,
	'options' | 'renderItem' | 'setFilter' | 'filter' | 'endReached' | 'value' | 'onChange'
> & {
	excludeId?: string;
	showIdleAgents?: boolean;
	onlyAvailable?: boolean;
	value: PaginatedMultiSelectOption[];
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
	...props
}: AutoCompleteMultipleAgentProps): ReactElement => {
	const [agentsFilter, setAgentsFilter] = useState<string>('');

	const debouncedAgentsFilter = useDebouncedValue(agentsFilter, 500);

	const { data: agentsItems, fetchNextPage } = useAgentsList({
		filter: debouncedAgentsFilter,
		onlyAvailable,
		excludeId,
		showIdleAgents,
	});

	return (
		<PaginatedMultiSelectFiltered
			{...props}
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
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteMultipleAgent);
