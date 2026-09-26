import { useRouter, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { AdminUserAction } from './useAdminUserInfoActions';
import { useCanManageUserStatus } from '../../../../hooks/useCanManageUserStatus';

export const useManageUserStatusAction = (userId: string): AdminUserAction | undefined => {
	const { t } = useTranslation();
	const router = useRouter();
	const canManageUserStatus = useCanManageUserStatus();
	const userStatusEnabled = useSetting('Accounts_UserStatus_Enabled', true);

	return canManageUserStatus && userStatusEnabled
		? {
				icon: 'circle-unfilled',
				content: t('Manage_user_status'),
				onClick: () => router.navigate({ name: 'admin-users', params: { context: 'edit', id: userId } }),
			}
		: undefined;
};
