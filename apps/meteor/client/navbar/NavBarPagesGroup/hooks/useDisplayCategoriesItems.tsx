import { CheckBox } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * "Display categories" toggles for the classic sidebar:
 * - Custom: show/hide custom categories (including Favorites).
 * - System: show/hide the system categories (Teams/Channels/Discussions/DMs); when off, their rooms are
 *   grouped into a single "Conversations" category. Backed by the existing `sidebarGroupByType` preference.
 */
export const useDisplayCategoriesItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const showCustom = useUserPreference<boolean>('sidebarShowCustomCategories', true);
	const showSystem = useUserPreference<boolean>('sidebarGroupByType');

	const handleToggleCustom = useCallback(
		() => saveUserPreferences({ data: { sidebarShowCustomCategories: !showCustom } }),
		[saveUserPreferences, showCustom],
	);
	const handleToggleSystem = useCallback(
		() => saveUserPreferences({ data: { sidebarGroupByType: !showSystem } }),
		[saveUserPreferences, showSystem],
	);

	return [
		{
			id: 'display-categories-custom',
			content: t('Custom'),
			icon: 'folder',
			addon: <CheckBox checked={showCustom} onChange={handleToggleCustom} />,
		},
		{
			id: 'display-categories-system',
			content: t('System'),
			icon: 'folder',
			addon: <CheckBox checked={Boolean(showSystem)} onChange={handleToggleSystem} />,
		},
	];
};
