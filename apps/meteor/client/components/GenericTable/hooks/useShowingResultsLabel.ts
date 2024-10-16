import type { Pagination } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type Props<T extends ComponentProps<typeof Pagination>['showingResultsLabel'] = ComponentProps<typeof Pagination>['showingResultsLabel']> =
	T extends (...args: any[]) => any ? Parameters<T> : never;

export const useShowingResultsLabel = (): ((...params: Props) => string) => {
	const { t } = useTranslation();
	return useCallback(
		({ count, current, itemsPerPage }) =>
			t('Showing_results_of', { postProcess: 'sprintf', sprintf: [current + 1, Math.min(current + itemsPerPage, count), count] }),
		[t],
	);
};
