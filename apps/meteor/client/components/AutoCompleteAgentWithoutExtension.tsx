import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { memo, useState } from 'react';

import { useAvailableAgentsList } from './Omnichannel/hooks/useAvailableAgentsList';

type AutoCompleteAgentProps = {
	value: string;
	haveAll?: boolean;
	currentExtension?: string;
	onChange: (value: string) => void;
};

const AutoCompleteAgentWithoutExtension = ({ value, currentExtension, onChange, ...props }: AutoCompleteAgentProps) => {
	const [agentsFilter, setAgentsFilter] = useState<string | number | undefined>('');

	const debouncedAgentsFilter = useDebouncedValue(agentsFilter as string, 500);

	const { data: agentsItems, fetchNextPage } = useAvailableAgentsList({
		filter: debouncedAgentsFilter,
		includeExtension: currentExtension,
	});

	return (
		<PaginatedSelectFiltered
			{...props}
			value={value}
			onChange={onChange}
			flexShrink={0}
			filter={agentsFilter as string | undefined}
			setFilter={setAgentsFilter}
			options={agentsItems}
			endReached={() => fetchNextPage()}
		/>
	);
};

export default memo(AutoCompleteAgentWithoutExtension);
