import type { IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useLogout } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import UserMenuHeader from '../UserMenuHeader';
import { useAccountItems } from './useAccountItems';
import { useStatusItems } from './useStatusItems';
// import { useVoipItemsSection } from './useVoipItemsSection';
import { useMediaCallAction } from '../../../NavBarV2/NavBarVoipGroup/hooks/useMediaCallAction';

export const useUserMenu = (user: IUser) => {
	const { t } = useTranslation();

	const statusItems = useStatusItems();
	const accountItems = useAccountItems();
	// const voipItemsSection = useVoipItemsSection();
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

	const mediaCallItem: GenericMenuItemProps = {
		id: 'media-call',
		icon: 'phone',
		content: t('Voice_call'),
		onClick: mediaCallAction.action,
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
