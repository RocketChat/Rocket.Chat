import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter, useSetModal, useToastMessageDispatch, useMethod, useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import { LegacyRoomManager } from '../../../../../../../app/ui-utils/client';
import { UiTextContext } from '../../../../../../../definition/IRoomTypeConfig';
import WarningModal from '../../../../../../components/WarningModal';
import { roomCoordinator } from '../../../../../../lib/rooms/roomCoordinator';

// TODO implement joined
export const useRoomLeave = (room: IRoom, joined = true) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const leaveRoom = useMethod('leaveRoom');
	const router = useRouter();

	const canLeave = usePermission(room.t === 'c' ? 'leave-c' : 'leave-p') && room.cl !== false && joined;

	const handleLeave = useMutableCallback(() => {
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
				cancelText={t('Cancel')}
				confirm={leaveAction}
			/>,
		);
	});

	return canLeave ? handleLeave : null;
};
