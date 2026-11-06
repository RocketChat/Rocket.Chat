import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserSidebarCategories } from './useUserSidebarCategories';

export const MAX_CATEGORY_NAME_LENGTH = 30;

export const useValidateCategoryName = () => {
	const { t } = useTranslation();
	const { customCategories } = useUserSidebarCategories();

	return useCallback(
		(name: string, excludeId?: string): string | undefined => {
			const trimmed = name.trim();
			if (!trimmed) {
				return t('Please_enter_a_category_name');
			}
			if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
				return t('Category_name_is_too_long__max__maxLength__characters', { maxLength: MAX_CATEGORY_NAME_LENGTH });
			}
			const normalized = trimmed.toLowerCase();
			if (SIDEBAR_SYSTEM_GROUP_KEYS.some((key) => t(key).toLowerCase() === normalized)) {
				return t('Category_name_conflicts_with_system_group');
			}
			if (customCategories.some((category) => category._id !== excludeId && category.name.trim().toLowerCase() === normalized)) {
				return t('A_category_with_this_name_already_exists');
			}
			return undefined;
		},
		[customCategories, t],
	);
};
