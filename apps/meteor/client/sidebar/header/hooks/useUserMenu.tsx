import type { IUser } from '@rocket.chat/core-typings';
import { Throbber } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useLogout } from '@rocket.chat/ui-contexts';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import UserMenuHeader from '../UserMenuHeader';
import { useAccountItems } from './useAccountItems';
import { useStatusItems } from './useStatusItems';

const getMediaCallItem = (mediaCallAction: ReturnType<typeof useMediaCallAction>): GenericMenuItemProps => {
	if (mediaCallAction.loading) {
		return { id: 'voice-call', content: mediaCallAction.title, onClick: mediaCallAction.action, status: <Throbber size={6} /> };
	}

	return {
		id: 'voice-call',
		icon: mediaCallAction.icon,
		content: mediaCallAction.title,
		onClick: mediaCallAction.action,
	};
};

export const useUserMenu = (user: IUser) => {
	const { t } = useTranslation();

	const statusItems = useStatusItems();
	const accountItems = useAccountItems();

	const mediaCallAction = useMediaCallAction();

	const logout = useLogout();
	const handleLogout = useEffectEvent(() => {
		logout();
	});

	const logoutItem: GenericMenuItemProps = {
		id: 'logout',
		icon: 'sign-out',
		content: t('Logout'),
		onClick: handleLogout,
	};

	const mediaCallItem = getMediaCallItem(mediaCallAction);

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
			items: [mediaCallItem],
		},
		{
			title: t('Account'),
			items: accountItems,
		},
		{
			items: [logoutItem],
		},
	].filter((section) => section !== undefined);
};
