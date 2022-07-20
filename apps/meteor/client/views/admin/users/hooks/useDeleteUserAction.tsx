import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useSetModal,
	useToastMessageDispatch,
	useRoute,
	useSetting,
	usePermission,
	useEndpoint,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { confirmOwnerChanges } from '../lib/confirmOwnerChanges';

export const useDeleteUserAction = (_id, onChange, onReload) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const handleCloseModal = useMutableCallback((): void => setModal());
	const userRoute = useRoute('admin-users');
	const canDeleteUser = usePermission('delete-user');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleDeletedUser = (): void => {
		handleCloseModal();
		userRoute.push({});
		onReload();
	};

	const deleteUserQuery = useMemo(() => ({ userId: _id }), [_id]);
	const deleteUserEndpoint = useEndpoint('POST', '/v1/users.delete');

	const erasureType = useSetting('Message_ErasureType');

	const deleteUser = confirmOwnerChanges(
		async (confirm = false) => {
			if (confirm) {
				deleteUserQuery.confirmRelinquish = confirm;
			}

			const result = await deleteUserEndpoint(deleteUserQuery);
			if (result.success) {
				handleDeletedUser();
				dispatchToastMessage({ type: 'success', message: t('User_has_been_deleted') });
			} else {
				handleCloseModal();
			}
		},
		{
			contentTitle: t(`Delete_User_Warning_${erasureType}`),
			confirmLabel: t('Delete'),
		},
		onChange,
	);

	const confirmDeleteUser = useCallback(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={deleteUser} onCancel={handleCloseModal} confirmText={t('Delete')}>
				{t(`Delete_User_Warning_${erasureType}`)}
			</GenericModal>,
		);
	}, [deleteUser, erasureType, handleCloseModal, setModal, t]);

	return canDeleteUser
		? {
				icon: 'trash',
				label: t('Delete'),
				action: confirmDeleteUser,
		  }
		: undefined;
};
