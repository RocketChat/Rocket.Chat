import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';

import { UiTextContext } from '../../../../../../../definition/IRoomTypeConfig';
import WarningModal from '../../../../../../components/WarningModal';
import { roomCoordinator } from '../../../../../../lib/rooms/roomCoordinator';

export const useRoomHide = (room: IRoom) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const hideRoom = useMethod('hideRoom');
	const router = useRouter();

	const handleHide = useMutableCallback(async () => {
		const hide = async () => {
			try {
				await hideRoom(room._id);
				router.navigate('/home');
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};

		const warnText = roomCoordinator.getRoomDirectives(room.t).getUiText(UiTextContext.HIDE_WARNING);

		setModal(
			<WarningModal
				text={t(warnText as TranslationKey, room.fname || room.name)}
				confirmText={t('Yes_hide_it')}
				close={() => setModal(null)}
				cancelText={t('Cancel')}
				confirm={hide}
			/>,
		);
	});

	return handleHide;
};
