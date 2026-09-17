import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { AdminUserAction } from './useAdminUserInfoActions';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';

export const useManageUserStatusAction = (username?: string): AdminUserAction | undefined => {
	const { t } = useTranslation();
	const router = useRouter();
	const canEditOtherUserInfo = usePermission('edit-other-user-info');
	const { data: hasUnlimitedPresence = false } = useHasLicenseModule('unlimited-presence');

	return canEditOtherUserInfo && hasUnlimitedPresence && username
		? {
				icon: 'circle-unfilled',
				content: t('Manage_status'),
				onClick: () => router.navigate({ name: 'user-status', params: { tab: 'user-presence', context: 'edit', id: username } }),
			}
		: undefined;
};
