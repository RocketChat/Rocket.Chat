import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import {
	useRouter,
	useSetModal,
	useToastMessageDispatch,
	useMethod,
	useTranslation,
	usePermission,
	useEndpoint,
} from '@rocket.chat/ui-contexts';
import React from 'react';

import { LegacyRoomManager } from '../../../../../../../app/ui-utils/client';
import { UiTextContext } from '../../../../../../../definition/IRoomTypeConfig';
import WarningModal from '../../../../../../components/WarningModal';
import { roomCoordinator } from '../../../../../../lib/rooms/roomCoordinator';
import LeaveTeam from '../../../../../teams/contextualBar/info/LeaveTeam';

// TODO implement joined
export const useRoomLeave = (room: IRoom, joined = true) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const leaveRoom = useMethod('leaveRoom');
	const leaveTeam = useEndpoint('POST', '/v1/teams.leave');

	const router = useRouter();

	const canLeave = usePermission(room.t === 'c' ? 'leave-c' : 'leave-p') && room.cl !== false && joined;

	const handleLeave = useEffectEvent(() => {
		if (room.teamMain && room.teamId) {
			const onConfirm = async (selectedRooms?: { [key: string]: Serialized<IRoom> & { isLastOwner?: boolean } }) => {
				if (!room.teamId) {
					return;
				}

				const roomsToLeave = selectedRooms?.length ? Object.keys(selectedRooms) : [];

				try {
					await leaveTeam({
						teamId: room.teamId,
						...(roomsToLeave.length && { rooms: roomsToLeave }),
					});
					dispatchToastMessage({ type: 'success', message: t('Teams_left_team_successfully') });
					router.navigate('/home');
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				} finally {
					setModal(null);
				}
			};

			setModal(<LeaveTeam onConfirm={onConfirm} onCancel={() => setModal(null)} teamId={room.teamId} />);
		}

		const leaveAction = async () => {
			try {
				await leaveRoom(room._id);
				router.navigate('/home');
				LegacyRoomManager.close(room._id);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};

		const warnText = roomCoordinator.getRoomDirectives(room.t).getUiText(UiTextContext.LEAVE_WARNING);

		setModal(
			<WarningModal
				text={t(warnText as TranslationKey, room.fname || room.name)}
				confirmText={t('Leave_room')}
				close={() => setModal(null)}
				cancel={() => setModal(null)}
				cancelText={t('Cancel')}
				confirm={leaveAction}
			/>,
		);
	});

	return canLeave ? handleLeave : null;
};
