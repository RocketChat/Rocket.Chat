import type { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, usePermission, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import GenericModal from '../../../../components/GenericModal';
import type { Action } from '../../../hooks/useActionSpread';

export const useDeleteUserAction = (userId: IUser['_id'], onReload: () => void): Action | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const userRoute = useRoute('admin-users');
	const canDeleteInviteRecord = usePermission('delete-invite-records');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleDeletedInviteRecord = (): void => {
		setModal();
		userRoute.push({});
		onReload();
	};

	// TODO: add endpoint and query to delete Invite records!
	const deleteInviteRecordEndpoint = useEndpoint('POST', '/v1/');
	const deleteInviteRecordQuery = '';

	const deleteInviteRecord = async (): Promise<void> => {
		try {
			await deleteInviteRecordEndpoint(deleteInviteRecordQuery);
			dispatchToastMessage({ type: 'success', message: t('Invite_record_deleted') });
			handleDeletedInviteRecord();
		} catch (error) {
			throw error;
		}
	};

	const confirmDeleteInviteRecord = useMutableCallback(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={deleteInviteRecord} onCancel={(): void => setModal()} confirmText={t('Delete')}>
				{t('Open_invitations_will_be_revoked')}
			</GenericModal>,
		);
	});

	return canDeleteInviteRecord
		? {
				icon: 'trash',
				label: t('Delete_record'),
				action: confirmDeleteInviteRecord,
		  }
		: undefined;
};
