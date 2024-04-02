import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';

export const useDeleteRoom = (room: IRoom, reload: () => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const deleteRoomEndpoint = useEndpoint('POST', room.t === 'c' ? '/v1/channels.delete' : '/v1/groups.delete');

	const handleDeleteRoom = () => {
		const onConfirmAction = async () => {
			try {
				await deleteRoomEndpoint({ roomId: room._id });
				dispatchToastMessage({ type: 'error', message: t('Room_has_been_deleted') });
				reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		return setModal(
			<GenericModal variant='danger' onCancel={() => setModal(null)} onConfirm={onConfirmAction} confirmText={t('Delete')}>
				<>
					<Box is='span' color='status-font-on-danger' fontWeight='600'>
						{t('Team_Delete_Channel_modal_content_danger')}
					</Box>
					<Box is='span'> {t('Team_Delete_Channel_modal_content')}</Box>
				</>
			</GenericModal>,
		);
	};

	return handleDeleteRoom;
};
