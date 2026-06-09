import type { IRoom, RoomType, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useRouter, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { LegacyRoomManager } from '../../../app/ui-utils/client';
import { UiTextContext } from '../../../definition/IRoomTypeConfig';
import WarningModal from '../../components/WarningModal';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import LeaveTeam from '../../views/teams/contextualBar/info/LeaveTeam';

const leaveEndpoints = {
	p: '/v1/groups.leave',
	c: '/v1/channels.leave',
	d: '/v1/im.leave',
	v: '/v1/channels.leave',
	l: '/v1/groups.leave',
} as const;

type LeaveRoomProps = {
	rid: string;
	type: RoomType;
	name: string;
	roomOpen?: boolean;
	teamId?: string;
	teamMain?: boolean;
};

export const useLeaveRoomAction = ({ rid, type, name, roomOpen, teamId, teamMain }: LeaveRoomProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRouter();

	const leaveRoom = useEndpoint('POST', leaveEndpoints[type]);
	const leaveTeam = useEndpoint('POST', '/v1/teams.leave');

	const handleLeave = useEffectEvent(() => {
		if (teamMain && teamId) {
			const onConfirm = async (selectedRooms: { [key: string]: Serialized<IRoom> & { isLastOwner?: boolean } } = {}) => {
				try {
					const roomsLeft = Object.keys(selectedRooms);
					const roomsToLeave = roomsLeft.length > 0 ? roomsLeft : [];

					await leaveTeam({
						teamId,
						...(roomsToLeave.length && { rooms: roomsToLeave }),
					});

					dispatchToastMessage({ type: 'success', message: t('Teams_left_team_successfully') });
					if (roomOpen) {
						router.navigate('/home');
					}
					LegacyRoomManager.close(rid);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				} finally {
					setModal(null);
				}
			};

			setModal(<LeaveTeam onConfirm={onConfirm} onCancel={() => setModal(null)} teamId={teamId} />);
			return;
		}

		const leave = async (): Promise<void> => {
			try {
				await leaveRoom({ roomId: rid });
				if (roomOpen) {
					router.navigate('/home');
				}
				LegacyRoomManager.close(rid);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		const warnText = roomCoordinator.getRoomDirectives(type).getUiText(UiTextContext.LEAVE_WARNING);

		setModal(
			<WarningModal
				text={t(warnText as TranslationKey, { roomName: name })}
				confirmText={t('Leave_room')}
				close={() => setModal(null)}
				cancelText={t('Cancel')}
				confirm={leave}
			/>,
		);
	});

	return handleLeave;
};
