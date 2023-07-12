import type { IUser } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserMenuHeader from '../UserMenuHeader';
import { useAccountItems } from './useAccountItems';
import { useStatusItems } from './useStatusItems';
import { useThemeItems } from './useThemeItems';

export const useUserMenu = (user: IUser) => {
	const t = useTranslation();

	const statusItems = useStatusItems(user);
	const themeItems = useThemeItems();
	const accountItems = useAccountItems();

	return [
		{
			title: <UserMenuHeader user={user} />,
			items: [],
		},
		{
			title: t('Status'),
			items: statusItems,
		},
		{
			title: t('Theme'),
			items: themeItems,
		},
		{
			items: accountItems,
		},
	];
};
