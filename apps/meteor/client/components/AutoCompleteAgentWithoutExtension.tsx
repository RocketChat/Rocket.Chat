import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { memo, useState } from 'react';

import { useInfiniteAvailableAgentsList } from './Omnichannel/hooks/useInfiniteAvailableAgentsList';

type AutoCompleteAgentProps = {
	onChange: (value: string) => void;
	haveAll?: boolean;
	value?: string;
	currentExtension?: string;
};

const AutoCompleteAgentWithoutExtension = (props: AutoCompleteAgentProps) => {
	const { value, currentExtension, onChange = (): void => undefined } = props;
	const [agentsFilter, setAgentsFilter] = useState<string | number | undefined>('');

	const debouncedAgentsFilter = useDebouncedValue(agentsFilter as string, 500);

	const { data: agentsItems = [], fetchNextPage } = useInfiniteAvailableAgentsList({
		text: debouncedAgentsFilter,
		includeExtension: currentExtension,
	});

	return (
		<PaginatedSelectFiltered
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
