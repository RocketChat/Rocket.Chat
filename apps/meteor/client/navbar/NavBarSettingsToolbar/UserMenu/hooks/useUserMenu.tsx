import type { IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useLogout } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import UserMenuHeader from '../UserMenuHeader';
import { useAccountItems } from './useAccountItems';
import { useKeyboardShortcutsModalHandler } from './useKeyboardShortcutsModalHandler';
import { useStatusItems } from './useStatusItems';
import { useUserDropdownAppsActionButtons } from '../../../../hooks/useUserDropdownAppsActionButtons';

export const useUserMenu = (user: IUser) => {
	const { t } = useTranslation();

	const statusItems = useStatusItems();
	const accountItems = useAccountItems();
	const appBoxItems = useUserDropdownAppsActionButtons();
	const handleKeyboardShortcuts = useKeyboardShortcutsModalHandler();

	const logout = useLogout();
	const handleLogout = useEffectEvent(() => {
		logout();
	});

	const keyboardShortcutsItem: GenericMenuItemProps = {
		id: 'keyboardShortcuts',
		icon: 'keyboard',
		content: t('Keyboard_Shortcuts_Title'),
		onClick: handleKeyboardShortcuts,
	};

	const logoutItem: GenericMenuItemProps = {
		id: 'logout',
		icon: 'sign-out',
		content: t('Logout'),
		onClick: handleLogout,
	};

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
			title: t('Account'),
			items: accountItems,
		},
		{
			items: [keyboardShortcutsItem],
		},
		...(appBoxItems.isSuccess && appBoxItems.data?.length ? [{ title: t('Apps'), items: appBoxItems.data }] : []),
		{
			items: [logoutItem],
		},
	].filter((section) => section !== undefined);
};
