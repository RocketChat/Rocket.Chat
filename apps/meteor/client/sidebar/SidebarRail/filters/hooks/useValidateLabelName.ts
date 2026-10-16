import { MAX_LABEL_NAME_LENGTH } from '@rocket.chat/core-typings';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useSubscriptionLabels } from './useSidebarFiltersPreferences';

export const useValidateLabelName = () => {
	const { t } = useTranslation();
	const labels = useSubscriptionLabels();

	return useCallback(
		(name: string, excludeId?: string): string | undefined => {
			const trimmed = name.trim();
			if (!trimmed) {
				return t('Required_field', { field: t('Name') });
			}
			if (trimmed.length > MAX_LABEL_NAME_LENGTH) {
				return t('Max_length_is', { limit: MAX_LABEL_NAME_LENGTH });
			}
			const normalized = trimmed.toLowerCase();
			if (labels.some((label) => label._id !== excludeId && label.name.trim().toLowerCase() === normalized)) {
				return t('Label_name_already_exists');
			}
			return undefined;
		},
		[labels, t],
	);
};
