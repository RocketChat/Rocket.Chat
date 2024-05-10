import { useTranslation } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useItemsPerPageLabel = (): (() => string) => {
	const t = useTranslation();
	return useCallback(() => t('Items_per_page:'), [t]);
};
