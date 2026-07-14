import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter, useSetModal, useToastMessageDispatch, useEndpoint, usePermission, useUserSubscription } from '@rocket.chat/ui-contexts';
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
	const leaveChannel = useEndpoint('POST', '/v1/channels.leave');
	const leaveGroup = useEndpoint('POST', '/v1/groups.leave');
	const leaveDirect = useEndpoint('POST', '/v1/im.leave');
	const router = useRouter();

	const canLeave = usePermission(room.t === 'c' ? 'leave-c' : 'leave-p') && room.cl !== false && Boolean(subscription);

	const handleLeave = useStableCallback(() => {
		const leaveAction = async () => {
			try {
				if (room.t === 'c') {
					await leaveChannel({ roomId: room._id });
				} else if (room.t === 'p') {
					await leaveGroup({ roomId: room._id });
				} else if (room.t === 'd') {
					await leaveDirect({ roomId: room._id });
				}
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
				text={
					<Box is='span' display='flex' flexDirection='column'>
						<Box is='span' mbe={room.encrypted ? 16 : 0}>
							{t(warnText as TranslationKey, { roomName: room.fname || room.name })}
						</Box>
						{room.encrypted && (
							<Box is='span' color='danger' fontScale='c1'>
								{t('E2E_Leave_Room_Warning')}
							</Box>
						)}
					</Box>
				}
				confirmText={t('Leave_room')}
				close={() => setModal(null)}
				cancelText={t('Cancel')}
				confirm={leaveAction}
			/>,
		);
	});

	return canLeave ? handleLeave : null;
};
