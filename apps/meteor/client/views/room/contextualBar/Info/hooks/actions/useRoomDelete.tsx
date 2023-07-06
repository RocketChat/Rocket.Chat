import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation, useEndpoint, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../../components/GenericModal';

// TODO: resetState for TeamsChannels
export const useRoomDelete = (room: IRoom, resetState?: () => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRouter();

	const hasPermissionToDelete = usePermission(room.t === 'c' ? 'delete-c' : 'delete-p', room._id);
	const canDelete = isRoomFederated(room) ? false : hasPermissionToDelete;

	const deleteRoom = useEndpoint('POST', room.t === 'c' ? '/v1/channels.delete' : '/v1/groups.delete');

	const handleDelete = useMutableCallback(() => {
		const onConfirm = async () => {
			try {
				await deleteRoom({ roomId: room._id });
				dispatchToastMessage({ type: 'success', message: t('Room_has_been_deleted') });
				if (resetState) {
					return resetState();
				}

				router.navigate('/home');
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
