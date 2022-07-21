import { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useSetModal,
	useToastMessageDispatch,
	useRoute,
	useSetting,
	usePermission,
	useEndpoint,
	useTranslation,
	TranslationKey,
} from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { Action } from '../../../hooks/useActionSpread';
import { useConfirmOwnerChanges } from './useConfirmOwnerChanges';

export const useDeleteUserAction = (userId: IUser['_id'], onChange: () => void, onReload: () => void): Action | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const userRoute = useRoute('admin-users');
	const canDeleteUser = usePermission('delete-user');
	const erasureType = useSetting('Message_ErasureType');
	const confirmOwnerChanges = useConfirmOwnerChanges();
	const dispatchToastMessage = useToastMessageDispatch();
	const handleCloseModal = useMutableCallback((): void => setModal());

	const handleDeletedUser = (): void => {
		handleCloseModal();
		userRoute.push({});
		onReload();
	};

	const deleteUserQuery = useMemo(() => ({ userId, confirmRelinquish: false }), [userId]);
	const deleteUserEndpoint = useEndpoint('POST', '/v1/users.delete');

	const deleteUser = (): Promise<void> =>
		confirmOwnerChanges(
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
				contentTitle: t(`Delete_User_Warning_${erasureType}` as TranslationKey),
				confirmText: t('Delete'),
			},
			onChange,
		);

	const confirmDeleteUser = useMutableCallback(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={deleteUser} onCancel={handleCloseModal} confirmText={t('Delete')}>
				{t(`Delete_User_Warning_${erasureType}` as TranslationKey)}
			</GenericModal>,
		);
	});

	return canDeleteUser
		? {
				icon: 'trash',
				label: t('Delete'),
				action: confirmDeleteUser,
		  }
		: undefined;
};
