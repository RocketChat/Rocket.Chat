import { useAtLeastOnePermission, usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { getSettingPermissionId } from '../../lib/authorization';

const PRIVILEGED_SETTING_PERMISSIONS = ['view-privileged-setting', 'edit-privileged-setting'];

export const useCanManageAISettings = (settingIds: string[]): boolean => {
	const settingPermissions = useMemo(() => settingIds.map(getSettingPermissionId), [settingIds]);
	const canManagePrivilegedSettings = useAtLeastOnePermission(PRIVILEGED_SETTING_PERMISSIONS);
	const canManageSelectedSettings = usePermission('manage-selected-settings');
	const canChangeSettings = useAtLeastOnePermission(settingPermissions);

	return canManagePrivilegedSettings || (canManageSelectedSettings && canChangeSettings);
};
