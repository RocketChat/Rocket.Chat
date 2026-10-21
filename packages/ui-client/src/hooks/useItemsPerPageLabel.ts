import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useItemsPerPageLabel = (): (() => string) => {
	const { t } = useTranslation();
	return useCallback(() => t('Items_per_page:'), [t]);
};
