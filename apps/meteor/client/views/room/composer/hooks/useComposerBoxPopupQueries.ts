import type { QueriesResults } from '@tanstack/react-query';
import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useEnablePopupPreview } from './useEnablePopupPreview';
import { slashCommands } from '../../../../../app/utils/client/slashCommand';
import type { ComposerPopupOption } from '../../contexts/ComposerPopupContext';

export const useComposerBoxPopupQueries = <T extends { _id: string; sort?: number }>(filter: unknown, popup?: ComposerPopupOption<T>) => {
	const shouldPopupPreview = useEnablePopupPreview(filter, popup);
	const [counter, setCounter] = useState(0);

	useEffect(() => {
		setCounter(0);
	}, [popup, filter]);

	const enableQuery =
		!popup ||
		(popup.preview &&
			Boolean(slashCommands.commands[(filter as any)?.cmd]) &&
			slashCommands.commands[(filter as any)?.cmd].providesPreview) ||
		shouldPopupPreview;

	const fetchData = async (source: 'local' | 'server') => {
		if (source === 'local' && popup?.getItemsFromLocal) {
			const items = await popup.getItemsFromLocal(filter);

			if (items.length < 5) {
				setCounter(1);
			}

			return items;
		}

		if (source === 'server' && popup?.getItemsFromServer) {
			return popup.getItemsFromServer(filter);
		}

		return [];
	};

	return {
		queries: useQueries({
			queries: (['local', 'server'] as const).map((source) => ({
				queryKey: ['message-popup', source, filter, popup],
				queryFn: () => fetchData(source),
				enabled: source === 'local' ? enableQuery : counter > 0,
			})),
		}) as QueriesResults<T[]>,
		suspended: !enableQuery,
		placeholderData: keepPreviousData,
	};
};
