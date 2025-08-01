import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter, useSetModal, useToastMessageDispatch, useMethod, useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import { useUser } from '@rocket.chat/ui-contexts';

import { LegacyRoomManager } from '../../../../../../../app/ui-utils/client';
import { UiTextContext } from '../../../../../../../definition/IRoomTypeConfig';
import WarningModal from '../../../../../../components/WarningModal';
import { roomCoordinator } from '../../../../../../lib/rooms/roomCoordinator';
import { useMemberExists } from '../../../../../hooks/useMemberExists';

export const useRoomLeave = (room: IRoom) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const leaveRoom = useMethod('leaveRoom');
	const router = useRouter();
	const user = useUser();

	if (!user?.username) {
		return null;
	}

	const {
		data: isMemberData,
		isSuccess: membershipCheckSuccess,
		isLoading: isMembershipStatusLoading
	} = useMemberExists({ roomId: room._id, username: user.username });

	const isMember = !isMembershipStatusLoading && membershipCheckSuccess && isMemberData?.isMember;
	const canLeave = usePermission(room.t === 'c' ? 'leave-c' : 'leave-p') && room.cl !== false && isMember;

	const handleLeave = useEffectEvent(() => {
		const leaveAction = async () => {
			try {
				await leaveRoom(room._id);
				router.navigate('/home');

				if (room.name) {
					LegacyRoomManager.close(`${room.t}${room.name}`);
				}
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};

		const warnText = roomCoordinator.getRoomDirectives(room.t).getUiText(UiTextContext.LEAVE_WARNING);

		setModal(
			<WarningModal
				text={t(warnText as TranslationKey, { roomName: room.fname || room.name })}
				confirmText={t('Leave_room')}
				close={() => setModal(null)}
				cancelText={t('Cancel')}
				confirm={leaveAction}
			/>,
		);
	});

	return canLeave ? handleLeave : null;
};
