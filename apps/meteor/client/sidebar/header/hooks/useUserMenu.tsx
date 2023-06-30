import type { IUser } from '@rocket.chat/core-typings';

import { useAccountItems } from './useAccountItems';
import { useStatusItems } from './useStatusItems';
import { useThemeItems } from './useThemeItems';
import { useUserStatusItem } from './useUserStatusItem';

export const useUserMenu = (user: IUser) => {
	const userHeaderItems = useUserStatusItem(user);
	const statusItems = useStatusItems(user);
	const themeItems = useThemeItems();
	const accountItems = useAccountItems();

	return [
		{
			items: userHeaderItems,
		},
		{
			title: 'Status',
			items: statusItems,
		},
		{
			title: 'Theme',
			items: themeItems,
		},
		{
			items: accountItems,
		},
	];
};
