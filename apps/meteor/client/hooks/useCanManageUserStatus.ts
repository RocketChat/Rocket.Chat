import { usePermission, useSetting } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from './useHasLicenseModule';

export const useCanManageUserStatus = (): boolean | undefined => {
	const canEditOtherUserInfo = usePermission('edit-other-user-info');
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');
	const adminStatusHidingEnabled = useSetting('Accounts_StatusVisibility_Admin_Enabled', false);
	const { data: hasPresenceModule, isPending } = useHasLicenseModule('unlimited-presence');

	if (!canEditOtherUserInfo || !canViewFullOtherUserInfo || !adminStatusHidingEnabled) {
		return false;
	}

	return isPending ? undefined : hasPresenceModule === true;
};
