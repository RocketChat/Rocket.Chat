import type { IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useLogout, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import UserMenuHeader from '../UserMenuHeader';
import { useAccountItems } from './useAccountItems';
import { useStatusItems } from './useStatusItems';
import { useVoipItemsSection } from './useVoipItemsSection';

export const useUserMenu = (user: IUser) => {
	const { t } = useTranslation();
	const router = useRouter();

	const statusItems = useStatusItems();
	const accountItems = useAccountItems();
	const voipItemsSection = useVoipItemsSection();

	const logout = useLogout();
	const handleLogout = useEffectEvent(() => {
		logout();
	});

	const handleProfileClick = () => {
		router.navigate('/account/profile');
	};

	const logoutItem: GenericMenuItemProps = {
		id: 'logout',
		icon: 'sign-out',
		content: t('Logout'),
		onClick: handleLogout,
	};

	return [
		{
			title: <div onClick={handleProfileClick} style={{ cursor: 'pointer' }}><UserMenuHeader user={user} /></div>,
			items: [],
		},
		{
			title: t('Status'),
			items: statusItems,
		},
		voipItemsSection,
		{
			title: t('Account'),
			items: accountItems,
		},
		{
			items: [logoutItem],
		},
	].filter((section) => section !== undefined);
};