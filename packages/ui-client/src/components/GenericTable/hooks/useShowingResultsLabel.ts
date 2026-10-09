import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useShowingResultsLabel = () => {
	const { t } = useTranslation();
	return useCallback(
		({ count, current, itemsPerPage }: { count: number; current: number; itemsPerPage: number }) =>
			t('Showing_results_of', { from: current + 1, to: Math.min(current + itemsPerPage, count), total: count }),
		[t],
	);
};
