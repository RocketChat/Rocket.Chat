import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useShowingResultsLabel = () => {
	const { t } = useTranslation();
	return useCallback(
		({ count, current, itemsPerPage }: { count: number; current: number; itemsPerPage: 25 | 50 | 100 }) =>
			t('Showing_results_of', { postProcess: 'sprintf', sprintf: [current + 1, Math.min(current + itemsPerPage, count), count] }),
		[t],
	);
};
