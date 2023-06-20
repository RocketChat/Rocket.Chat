import type { MenuItemIcon } from '@rocket.chat/fuselage';
import { CheckBox } from '@rocket.chat/fuselage';
import { useEndpoint, useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode } from 'react';
import React, { useCallback } from 'react';

export type Item = {
	id: string;
	icon?: ComponentProps<typeof MenuItemIcon>['name'];
	name?: string;
	input?: ReactNode;
	content?: ReactNode;
	onClick?: () => void;
};

export const useGroupingListItems = (): Item[] => {
	const t = useTranslation();

	const sidebarGroupByType = useUserPreference<boolean>('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference<boolean>('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread');

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const useHandleChange = (key: 'sidebarGroupByType' | 'sidebarShowFavorites' | 'sidebarShowUnread', value: boolean): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { [key]: value } }), [key, value]);

	const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
	const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
	const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);

	return [
		{
			id: 'unread',
			name: t('Unread'),
			icon: 'flag',
			input: <CheckBox mi='x16' onChange={handleChangeShowUnread} checked={sidebarShowUnread} />,
		},
		{
			id: 'favorites',
			name: t('Favorites'),
			icon: 'star',
			input: <CheckBox mi='x16' onChange={handleChangeShoFavorite} checked={sidebarShowFavorites} />,
		},
		{
			id: 'types',
			name: t('Types'),
			icon: 'group-by-type',
			input: <CheckBox mi='x16' onChange={handleChangeGroupByType} checked={sidebarGroupByType} />,
		},
	];
};
