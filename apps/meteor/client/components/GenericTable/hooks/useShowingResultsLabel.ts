import { Pagination } from '@rocket.chat/fuselage';
import { ComponentProps, useCallback } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

type Props<T extends ComponentProps<typeof Pagination>['showingResultsLabel'] = ComponentProps<typeof Pagination>['showingResultsLabel']> =
	T extends (...args: any[]) => any ? Parameters<T> : never;

export const useShowingResultsLabel = (): ((...params: Props) => string) => {
	const t = useTranslation();
	return useCallback(
		({ count, current, itemsPerPage }) => t('Showing_results_of', current + 1, Math.min(current + itemsPerPage, count), count),
		[t],
	);
};
