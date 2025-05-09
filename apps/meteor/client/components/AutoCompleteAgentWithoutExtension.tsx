import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { memo, useMemo, useState } from 'react';

import { useRecordList } from '../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../lib/asyncState';
import { useAvailableAgentsList } from './Omnichannel/hooks/useAvailableAgentsList';

type AutoCompleteAgentProps = {
	onChange: (value: string) => void;
	haveAll?: boolean;
	value?: string;
	currentExtension?: string;
};

const AutoCompleteAgentWithoutExtension = (props: AutoCompleteAgentProps) => {
	const { value, currentExtension, onChange = (): void => undefined, haveAll = false } = props;
	const [agentsFilter, setAgentsFilter] = useState<string | number | undefined>('');

	const debouncedAgentsFilter = useDebouncedValue(agentsFilter as string, 500);

	const { itemsList: AgentsList, loadMoreItems: loadMoreAgents } = useAvailableAgentsList(
		useMemo(
			() => ({ text: debouncedAgentsFilter, includeExtension: currentExtension, haveAll }),
			[currentExtension, debouncedAgentsFilter, haveAll],
		),
	);
	const { phase: agentsPhase, items: agentsItems, itemCount: agentsTotal } = useRecordList(AgentsList);
	const sortedByName = agentsItems
		.sort((a, b) => {
			if (value === 'all') {
				return -1;
			}

			if (a?.username?.localeCompare(b?.username || '')) {
				return 1;
			}
			if (b?.username?.localeCompare(b?.username || '')) {
				return -1;
			}

			return 0;
		})
		.map((agent): ILivechatAgent & { label: string; value: string } => ({
			...agent,
			label: agent?.username || '',
			value: agent?.username || '',
		}));

	return (
		<PaginatedSelectFiltered
			value={value}
			onChange={onChange}
			flexShrink={0}
			filter={agentsFilter as string | undefined}
			setFilter={setAgentsFilter}
			options={sortedByName}
			endReached={
				agentsPhase === AsyncStatePhase.LOADING ? (): void => undefined : (start): void => loadMoreAgents(start, Math.min(50, agentsTotal))
			}
		/>
	);
};

export default memo(AutoCompleteAgentWithoutExtension);
