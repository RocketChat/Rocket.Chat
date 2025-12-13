import type { IUser } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, usePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdminUserAction } from './useAdminUserInfoActions';

export const useChangeAdminStatusAction = (
	username: IUser['username'] = '',
	isAdmin: boolean,
	onChange: () => void,
): AdminUserAction | undefined => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const addUserToRoleEndpoint = useEndpoint('POST', '/v1/roles.addUserToRole');
	const removeUserFromRoleEndpoint = useEndpoint('POST', '/v1/roles.removeUserFromRole');

	const canAssignAdminRole = usePermission('assign-admin-role');

	const changeAdminStatus = useCallback(async () => {
		try {
			if (isAdmin) {
				await removeUserFromRoleEndpoint({ roleId: 'admin', username });
				dispatchToastMessage({ type: 'success', message: t('User_is_no_longer_an_admin') });
				onChange();
				return;
			}
			await addUserToRoleEndpoint({ roleId: 'admin', username });
			dispatchToastMessage({ type: 'success', message: t('User_is_now_an_admin') });
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [isAdmin, removeUserFromRoleEndpoint, username, dispatchToastMessage, addUserToRoleEndpoint, t, onChange]);

	return canAssignAdminRole
		? {
				icon: 'key',
				content: isAdmin ? t('Remove_Admin') : t('Make_Admin'),
				onClick: changeAdminStatus,
			}
		: undefined;
};
