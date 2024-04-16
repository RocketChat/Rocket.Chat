import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';

import { UiTextContext } from '../../../../../../../definition/IRoomTypeConfig';
import { GenericModalDoNotAskAgain } from '../../../../../../components/GenericModal';
import { useDontAskAgain } from '../../../../../../hooks/useDontAskAgain';
import { roomCoordinator } from '../../../../../../lib/rooms/roomCoordinator';

export const useRoomHide = (room: IRoom) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const hideRoom = useMethod('hideRoom');
	const router = useRouter();

	const dontAskHideRoom = useDontAskAgain('hideRoom');

	const handleHide = useEffectEvent(async () => {
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

		if (dontAskHideRoom) {
			return hide();
		}

		setModal(
			<GenericModalDoNotAskAgain
				variant='danger'
				confirmText={t('Yes_hide_it')}
				cancelText={t('Cancel')}
				onCancel={() => setModal(null)}
				onConfirm={hide}
				dontAskAgain={{
					action: 'hideRoom',
					label: t('Hide_room'),
				}}
			>
				{t(warnText as TranslationKey, room.fname)}
			</GenericModalDoNotAskAgain>,
		);
	});

	return handleHide;
};
