import { useAccountItems } from './useAccountItems';
import { useStatusItems } from './useStatusItems';
import { useThemeItems } from './useThemeItems';
import { useUserStatusItem } from './useUserStatusItem';

export const useUserDropdownMenu = () => {
	const userHeaderItems = useUserStatusItem();
	const statusItems = useStatusItems();
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
