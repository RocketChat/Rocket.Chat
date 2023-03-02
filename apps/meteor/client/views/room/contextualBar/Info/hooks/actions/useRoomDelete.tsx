import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useTranslation, useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../../components/GenericModal';

// TODO: resetState
export const useRoomDelete = (room: IRoom, resetState?: any) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRoute('home');
	const deleteRoom = useEndpoint('POST', room.t === 'c' ? '/v1/channels.delete' : '/v1/groups.delete');

	const hasPermissionToDelete = usePermission(room.t === 'c' ? 'delete-c' : 'delete-p', room._id);
	const canDelete = isRoomFederated(room) ? false : hasPermissionToDelete;

	const handleDelete = useMutableCallback(() => {
		const onConfirm = async () => {
			try {
				resetState?.({});
				await deleteRoom({ roomId: room._id });
				dispatchToastMessage({ type: 'success', message: t('Room_has_been_deleted') });
				!resetState && router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};

		setModal(
			<GenericModal variant='danger' onConfirm={onConfirm} onCancel={() => setModal(null)} confirmText={t('Yes_delete_it')}>
				{t('Delete_Room_Warning')}
			</GenericModal>,
		);
	});

	return canDelete ? handleDelete : null;
};
