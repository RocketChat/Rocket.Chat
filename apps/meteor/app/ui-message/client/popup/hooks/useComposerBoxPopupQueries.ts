import type { QueriesResults } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { ComposerPopupOption } from '../../../../../client/views/room/contexts/ComposerPopupContext';
import { slashCommands } from '../../../../utils/lib/slashCommand';
import { useEnablePopupPreview } from './useEnablePopupPreview';

export const useComposerBoxPopupQueries = <T extends { _id: string; sort?: number }>(filter: unknown, popup?: ComposerPopupOption<T>) => {
	const [counter, setCounter] = useState(0);

	useEffect(() => {
		setCounter(0);
	}, [popup, filter]);

	const shouldPopupPreview = useEnablePopupPreview(filter, popup);

	const enableQuery =
		!popup ||
		(popup.preview &&
			Boolean(slashCommands.commands[(filter as any)?.cmd]) &&
			slashCommands.commands[(filter as any)?.cmd].providesPreview) ||
		shouldPopupPreview;

	return {
		queries: useQueries({
			queries: [
				popup?.getItemsFromLocal && {
					keepPreviousData: true,
					queryKey: ['message-popup', 'local', filter, popup],
					queryFn: () => popup?.getItemsFromLocal && popup.getItemsFromLocal(filter),
					onSuccess: (args: T[]) => {
						if (args.length < 5) {
							setCounter(1);
						}
					},
					enabled: enableQuery,
				},
				popup?.getItemsFromServer && {
					keepPreviousData: true,
					queryKey: ['message-popup', 'server', filter, popup],
					queryFn: () => popup?.getItemsFromServer && popup.getItemsFromServer(filter),
					enabled: counter > 0,
				},
			].filter(Boolean) as any,
		}) as QueriesResults<T[]>,
		suspended: !enableQuery,
	};
};
