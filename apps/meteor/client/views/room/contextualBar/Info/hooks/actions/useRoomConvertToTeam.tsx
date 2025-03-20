import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation, useEndpoint, usePermission } from '@rocket.chat/ui-contexts';

import GenericModal from '../../../../../../components/GenericModal';
import { useCanEditRoom } from '../useCanEditRoom';

export const useRoomConvertToTeam = (room: IRoom) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const canEdit = useCanEditRoom(room);
	const hasPermissionToConvertRoomToTeam = usePermission('create-team');
	const canConvertRoomToTeam = isRoomFederated(room) ? false : hasPermissionToConvertRoomToTeam;
	const allowConvertToTeam = !room.teamId && !room.prid && canConvertRoomToTeam && canEdit;

	const convertRoomToTeam = useEndpoint('POST', room.t === 'c' ? '/v1/channels.convertToTeam' : '/v1/groups.convertToTeam');

	const handleConvertToTeam = useEffectEvent(async () => {
		const onConfirm = async () => {
			try {
				await convertRoomToTeam(room.t === 'c' ? { channelId: room._id } : { roomId: room._id });
				dispatchToastMessage({ type: 'success', message: t('Room_has_been_converted') });
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
