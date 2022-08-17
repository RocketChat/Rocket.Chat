import { IUser } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useMethod, useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { Action } from '../../../hooks/useActionSpread';

export const useChangeAdminStatusAction = (userId: IUser['_id'], isAdmin: boolean, onChange: () => void): Action | undefined => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setAdminStatus = useMethod('setAdminStatus');
	const canAssignAdminRole = usePermission('assign-admin-role');

	const changeAdminStatus = useCallback(async () => {
		try {
			await setAdminStatus(userId, !isAdmin);
			const message = isAdmin ? 'User_is_no_longer_an_admin' : 'User_is_now_an_admin';
			dispatchToastMessage({ type: 'success', message: t(message) });
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [userId, dispatchToastMessage, isAdmin, onChange, setAdminStatus, t]);

	return canAssignAdminRole
		? {
				icon: 'key',
				label: isAdmin ? t('Remove_Admin') : t('Make_Admin'),
				action: changeAdminStatus,
		  }
		: undefined;
};
