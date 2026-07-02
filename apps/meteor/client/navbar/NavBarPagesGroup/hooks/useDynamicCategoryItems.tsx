import { RadioButton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The "Dynamic" category (classic sidebar), a single category rendered first in the list:
 * - None: no dynamic category.
 * - Mention: a "Mentions" category with only the rooms where you were mentioned (@you / @group).
 * - Unreads: an "Unread" category with all unread rooms (with or without mentions).
 */
export const useDynamicCategoryItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const dynamic = useUserPreference<'none' | 'mention' | 'unreads'>('sidebarDynamicCategory', 'none');

	const setNone = useCallback(() => saveUserPreferences({ data: { sidebarDynamicCategory: 'none' } }), [saveUserPreferences]);
	const setMention = useCallback(() => saveUserPreferences({ data: { sidebarDynamicCategory: 'mention' } }), [saveUserPreferences]);
	const setUnreads = useCallback(() => saveUserPreferences({ data: { sidebarDynamicCategory: 'unreads' } }), [saveUserPreferences]);

	return [
		{
			id: 'dynamic-none',
			content: t('None'),
			icon: 'folder',
			addon: <RadioButton checked={dynamic === 'none'} onChange={setNone} />,
		},
		{
			id: 'dynamic-mention',
			content: t('Mentions'),
			icon: 'folder',
			addon: <RadioButton checked={dynamic === 'mention'} onChange={setMention} />,
		},
		{
			id: 'dynamic-unreads',
			content: t('Unreads'),
			icon: 'folder',
			addon: <RadioButton checked={dynamic === 'unreads'} onChange={setUnreads} />,
		},
	];
};
