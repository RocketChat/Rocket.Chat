import type { QueriesResults } from '@tanstack/react-query';
import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useEnablePopupPreview } from './useEnablePopupPreview';
import { slashCommands } from '../../../../../app/utils/client/slashCommand';
import type { ComposerPopupOption } from '../../contexts/ComposerPopupContext';

export const useComposerBoxPopupQueries = <T extends { _id: string; sort?: number }>(filter: unknown, popup?: ComposerPopupOption<T>) => {
	const [counter, setCounter] = useState(0);

	useEffect(() => {
		setCounter(0);
	}, [popup, filter]);

	const shouldPopupPreview = useEnablePopupPreview(filter, popup);

	const hasCmd = (filter: unknown): filter is { cmd: string } => 
		typeof filter === 'object' && filter !== null && 'cmd' in filter && typeof (filter as Record<string, unknown>).cmd === 'string';

	const enableQuery =
		!popup ||
		(popup.preview &&
			hasCmd(filter) &&
			Boolean(slashCommands.commands[filter.cmd]) &&
			slashCommands.commands[filter.cmd].providesPreview) ||
		shouldPopupPreview;

	const queries = useQueries({
		queries: [
			{
				placeholderData: keepPreviousData,
				queryKey: ['message-popup', 'local', filter, popup],
				queryFn: () => (popup?.getItemsFromLocal && popup.getItemsFromLocal(filter)) || [],
				enabled: enableQuery,
			},
			{
				placeholderData: keepPreviousData,
				queryKey: ['message-popup', 'server', filter, popup],
				queryFn: () => (popup?.getItemsFromServer && popup.getItemsFromServer(filter)) || [],
				enabled: counter > 0,
			},
		],
	}) as QueriesResults<T[]>;

	useEffect(() => {
		if (Array.isArray(queries[0].data) && queries[0].data.length < 5) {
			setCounter(1);
		}
	}, [queries]);

	return {
		queries,
		suspended: !enableQuery,
	};
};
