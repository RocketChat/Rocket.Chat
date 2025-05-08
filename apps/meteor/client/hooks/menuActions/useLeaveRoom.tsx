import type { RoomType } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useRouter, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { LegacyRoomManager } from '../../../app/ui-utils/client';
import { UiTextContext } from '../../../definition/IRoomTypeConfig';
import WarningModal from '../../components/WarningModal';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

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
};

// TODO: this menu action should consider team leaving
export const useLeaveRoomAction = ({ rid, type, name, roomOpen }: LeaveRoomProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRouter();

	const leaveRoom = useEndpoint('POST', leaveEndpoints[type]);

	const handleLeave = useEffectEvent(() => {
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
