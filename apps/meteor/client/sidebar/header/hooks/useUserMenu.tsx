import type { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLogout, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';
import UserMenuHeader from '../UserMenuHeader';
import { useAccountItems } from './useAccountItems';
import { useStatusItems } from './useStatusItems';
import useVoiceCallItems from './useVoiceCallItems';

export const useUserMenu = (user: IUser) => {
	const t = useTranslation();

	const statusItems = useStatusItems();
	const accountItems = useAccountItems();
	const voiceCallItems = useVoiceCallItems();

	const logout = useLogout();
	const handleLogout = useMutableCallback(() => {
		logout();
	});

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
			items: voiceCallItems,
		},
		{
			title: t('Account'),
			items: accountItems,
		},
		{
			items: [logoutItem],
		},
	];
};
