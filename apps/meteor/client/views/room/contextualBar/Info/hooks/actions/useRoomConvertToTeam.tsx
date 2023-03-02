import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation, useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../../components/GenericModal';
import { useCanEditRoom } from '../useCanEditRoom';

export const useRoomConvertToTeam = (room: IRoom) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const convertRoomToTeam = useEndpoint('POST', room.t === 'c' ? '/v1/channels.convertToTeam' : '/v1/groups.convertToTeam');

	const hasPermissionToConvertRoomToTeam = usePermission('create-team');

	const canEdit = useCanEditRoom(room);
	const canConvertRoomToTeam = isRoomFederated(room) ? false : hasPermissionToConvertRoomToTeam;
	const allowConvertToTeam = !room.teamId && !room.prid && canConvertRoomToTeam && canEdit;

	const handleConvertToTeam = useMutableCallback(async () => {
		const data = room.t === 'c' ? { channelId: room._id } : { roomId: room._id };
		const onConfirm = async () => {
			try {
				await convertRoomToTeam(data);
				dispatchToastMessage({ type: 'success', message: t('Success') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal
				title={t('Confirmation')}
				variant='warning'
				onClose={() => setModal(null)}
				onCancel={() => setModal(null)}
				onConfirm={onConfirm}
				confirmText={t('Convert')}
			>
				{t('Converting_channel_to_a_team')}
			</GenericModal>,
		);
	});

	return allowConvertToTeam ? handleConvertToTeam : null;
};
