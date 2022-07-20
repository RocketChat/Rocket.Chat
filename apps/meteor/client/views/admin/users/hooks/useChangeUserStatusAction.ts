import { useToastMessageDispatch, useTranslation, useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { confirmOwnerChanges } from '../lib/confirmOwnerChanges';

export const useChangeUserStatusAction = (_id, isActive, onChange) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const canEditOtherUserActiveStatus = usePermission('edit-other-user-active-status');

	const activeStatusQuery = useMemo(
		() => ({
			userId: _id,
			activeStatus: !isActive,
		}),
		[_id, isActive],
	);
	const changeActiveStatusMessage = isActive ? 'User_has_been_deactivated' : 'User_has_been_activated';
	const changeActiveStatusRequest = useEndpoint('POST', '/v1/users.setActiveStatus');

	const changeActiveStatus = confirmOwnerChanges(
		async (confirm = false) => {
			if (confirm) {
				activeStatusQuery.confirmRelinquish = confirm;
			}

			try {
				const result = await changeActiveStatusRequest(activeStatusQuery);
				if (result.success) {
					dispatchToastMessage({ type: 'success', message: t(changeActiveStatusMessage) });
					onChange();
				}
			} catch (error) {
				throw error;
			}
		},
		{
			confirmLabel: t('Yes_deactivate_it'),
		},
		onChange,
	);

	return canEditOtherUserActiveStatus
		? {
				icon: 'user',
				label: isActive ? t('Deactivate') : t('Activate'),
				action: changeActiveStatus,
		  }
		: undefined;
};
