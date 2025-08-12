import type { IUser } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useTranslation, useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { AdminUserAction } from './useAdminUserInfoActions';
import { useConfirmOwnerChanges } from './useConfirmOwnerChanges';

export const useChangeUserStatusAction = (userId: IUser['_id'], isActive: boolean, onChange: () => void): AdminUserAction | undefined => {
	const t = useTranslation();
	const confirmOwnerChanges = useConfirmOwnerChanges();
	const dispatchToastMessage = useToastMessageDispatch();
	const changeActiveStatusRequest = useEndpoint('POST', '/v1/users.setActiveStatus');
	const canEditOtherUserActiveStatus = usePermission('edit-other-user-active-status');
	const changeActiveStatusMessage = isActive ? 'User_has_been_deactivated' : 'User_has_been_activated';

	const activeStatusQuery = useMemo(
		() => ({
			userId,
			activeStatus: !isActive,
			confirmRelinquish: false,
		}),
		[userId, isActive],
	);

	const changeActiveStatus = (): Promise<void> =>
		confirmOwnerChanges(
			async (confirm = false) => {
				if (confirm) {
					activeStatusQuery.confirmRelinquish = confirm;
				}

				try {
					await changeActiveStatusRequest(activeStatusQuery);
					dispatchToastMessage({ type: 'success', message: t(changeActiveStatusMessage) });
					onChange();
				} catch (error) {
					throw error;
				}
			},
			{
				confirmText: t('Yes_deactivate_it'),
			},
			onChange,
		);

	return canEditOtherUserActiveStatus
		? {
				icon: 'user',
				content: isActive ? t('Deactivate') : t('Activate'),
				onClick: changeActiveStatus,
			}
		: undefined;
};
