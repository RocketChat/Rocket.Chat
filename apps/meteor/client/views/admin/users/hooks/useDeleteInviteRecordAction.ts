import type { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import {
	useSetModal,
	useToastMessageDispatch,
	useRoute,
	useSetting,
	usePermission,
	useEndpoint,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import type { Action } from '../../../hooks/useActionSpread';
import { useConfirmOwnerChanges } from './useConfirmOwnerChanges';
import GenericModal from '../../../../components/GenericModal';

export const useDeleteInviteRecordAction = (userId: IUser['_id'], onChange: () => void, onReload: () => void): Action | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const userRoute = useRoute('admin-users');
	const canDeleteInviteRecord = usePermission('delete-invite-records'); // TODO: check if this new permission is correct
	const erasureType = useSetting('Message_ErasureType');
	const confirmOwnerChanges = useConfirmOwnerChanges();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleDeletedUser = (): void => {
		setModal();
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

				try {
					await deleteUserEndpoint(deleteUserQuery);
					dispatchToastMessage({ type: 'success', message: t('User_has_been_deleted') });
					handleDeletedUser();
				} catch (error) {
					throw error;
				}
			},
			{
				contentTitle: t(`Delete_User_Warning_${erasureType}` as TranslationKey),
				confirmText: t('Delete'),
			},
			onChange,
		);

	const confirmDeleteInviteRecord = useMutableCallback(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={deleteUser} onCancel={(): void => setModal()} confirmText={t('Delete_record')}>
				{t('Open_invitations_will_be_revoked')}
			</GenericModal>,
		);
	});

	return canDeleteInviteRecord
		? {
				icon: 'ignore',
				label: t('Revoke'),
				action: confirmDeleteInviteRecord, // TODO: change
		  }
		: undefined;
};
