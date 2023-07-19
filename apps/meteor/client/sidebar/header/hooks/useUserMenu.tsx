import type { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLogout, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserMenuHeader from '../UserMenuHeader';
import { useAccountItems } from './useAccountItems';
import { useStatusItems } from './useStatusItems';

export const useUserMenu = (user: IUser) => {
	const t = useTranslation();

	const statusItems = useStatusItems(user);
	const accountItems = useAccountItems();

	const logout = useLogout();
	const handleLogout = useMutableCallback(() => {
		logout();
	});

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
			items: [
				{
					id: 'logout',
					icon: 'sign-out',
					content: t('Logout'),
					onClick: handleLogout,
				},
			],
		},
	];
};
