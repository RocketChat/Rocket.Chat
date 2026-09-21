import { usePermission, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { AdminUserAction } from './useAdminUserInfoActions';

export const useManageUserStatusAction = (username?: string): AdminUserAction | undefined => {
	const { t } = useTranslation();
	const router = useRouter();
	const canEditOtherUserInfo = usePermission('edit-other-user-info');
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');
	const adminStatusHidingEnabled = useSetting('Accounts_StatusVisibility_Admin_Enabled', false);

	return canEditOtherUserInfo && canViewFullOtherUserInfo && adminStatusHidingEnabled && username
		? {
				icon: 'circle-unfilled',
				content: t('Manage_status'),
				onClick: () => router.navigate({ name: 'user-status', params: { tab: 'user-presence', context: 'edit', id: username } }),
			}
		: undefined;
};
