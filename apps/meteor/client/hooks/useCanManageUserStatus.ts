import { usePermission, useSetting } from '@rocket.chat/ui-contexts';

export const useCanManageUserStatus = (): boolean => {
	const canEditOtherUserInfo = usePermission('edit-other-user-info');
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');
	const adminStatusHidingEnabled = useSetting('Accounts_StatusVisibility_Admin_Enabled', false);

	return canEditOtherUserInfo && canViewFullOtherUserInfo && adminStatusHidingEnabled;
};
