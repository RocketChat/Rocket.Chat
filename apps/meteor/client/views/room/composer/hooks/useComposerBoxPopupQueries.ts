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
					placeholderData: keepPreviousData,
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
					placeholderData: keepPreviousData,
					queryKey: ['message-popup', 'server', filter, popup],
					queryFn: () => popup?.getItemsFromServer && popup.getItemsFromServer(filter),
					enabled: counter > 0,
				},
			].filter(Boolean) as any,
		}) as QueriesResults<T[]>,
		suspended: !enableQuery,
	};
};
