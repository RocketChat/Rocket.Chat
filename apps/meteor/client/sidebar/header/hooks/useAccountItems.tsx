import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLogout, useRoute, useTranslation } from '@rocket.chat/ui-contexts';

import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';

export const useAccountItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();
	const accountRoute = useRoute('account-index');
	const logout = useLogout();

	const handleMyAccount = useMutableCallback(() => {
		accountRoute.push({});
	});

	const handleLogout = useMutableCallback(() => {
		logout();
	});

	return [
		{
			id: 'my-account',
			icon: 'user',
			content: t('My_Account'),
			onClick: handleMyAccount,
		},
		{
			id: 'logout',
			icon: 'sign-out',
			content: t('Logout'),
			onClick: handleLogout,
		},
	];
};
