import { useCallback } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

export const useItemsPerPageLabel = (): (() => string) => {
	const t = useTranslation();
	return useCallback(() => t('Items_per_page:'), [t]);
};
