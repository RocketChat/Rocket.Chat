import { usePermission, useRoute } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { AdminUserAction } from './useAdminUserInfoActions';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';

export const useManageUserStatusAction = (): AdminUserAction | undefined => {
	const { t } = useTranslation();
	const statusRoute = useRoute('user-status');
	const canEditOtherUserInfo = usePermission('edit-other-user-info');
	const { data: hasUnlimitedPresence } = useHasLicenseModule('unlimited-presence');

	return canEditOtherUserInfo && hasUnlimitedPresence
		? {
				icon: 'circle-unfilled',
				content: t('Manage_status'),
				onClick: () => statusRoute.push({ tab: 'user-presence' }),
			}
		: undefined;
};
