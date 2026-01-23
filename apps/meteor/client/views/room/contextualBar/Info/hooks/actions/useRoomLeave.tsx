import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter, useSetModal, useToastMessageDispatch, useMethod, usePermission, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { LegacyRoomManager } from '../../../../../../../app/ui-utils/client';
import { UiTextContext } from '../../../../../../../definition/IRoomTypeConfig';
import WarningModal from '../../../../../../components/WarningModal';
import { roomCoordinator } from '../../../../../../lib/rooms/roomCoordinator';

export const useRoomLeave = (room: IRoom) => {
	const { t } = useTranslation();
	const subscription = useUserSubscription(room._id);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const leaveRoom = useMethod('leaveRoom');
	const router = useRouter();

	const canLeave = usePermission(room.t === 'c' ? 'leave-c' : 'leave-p') && room.cl !== false && Boolean(subscription);

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
