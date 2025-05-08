import type { RoomType } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetModal, useToastMessageDispatch, useRouter, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useDontAskAgain } from './useDontAskAgain';
import { UiTextContext } from '../../definition/IRoomTypeConfig';
import { GenericModalDoNotAskAgain } from '../components/GenericModal';
import { updateSubscription } from '../lib/mutationEffects/updateSubscription';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

type HideRoomProps = {
	rid: string;
	type: RoomType;
	name: string;
};

type HideRoomOptions = {
	redirect?: boolean;
};

const CLOSE_ENDPOINTS_BY_ROOM_TYPE = {
	p: '/v1/groups.close', // private
	c: '/v1/channels.close', // channel
	d: '/v1/im.close', // direct message
	v: '/v1/channels.close', // omnichannel voip
	l: '/v1/channels.close', // livechat
} as const;

export const useHideRoomAction = ({ rid: roomId, type, name }: HideRoomProps, { redirect = true }: HideRoomOptions = {}) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const closeModal = useEffectEvent(() => setModal());
	const dispatchToastMessage = useToastMessageDispatch();
	const dontAskHideRoom = useDontAskAgain('hideRoom');
	const router = useRouter();
	const userId = useUserId();

	const hideRoomEndpoint = useEndpoint('POST', CLOSE_ENDPOINTS_BY_ROOM_TYPE[type]);

	const hideRoom = useMutation({
		mutationFn: () => hideRoomEndpoint({ roomId }),
		onMutate: async () => {
			closeModal();

			if (userId) {
				return updateSubscription(roomId, userId, { alert: false, open: false });
			}
		},
		onSuccess: () => {
			if (redirect) {
				router.navigate('/home');
			}
		},
		onError: async (error, _, rollbackDocument) => {
			dispatchToastMessage({ type: 'error', message: error });

			if (userId && rollbackDocument) {
				const { alert, open } = rollbackDocument;
				updateSubscription(roomId, userId, { alert, open });
			}
		},
	});

	const handleHide = useEffectEvent(async () => {
		const warnText = roomCoordinator.getRoomDirectives(type).getUiText(UiTextContext.HIDE_WARNING);

		if (dontAskHideRoom) {
			hideRoom.mutate();
			return;
		}

		setModal(
			<GenericModalDoNotAskAgain
				variant='danger'
				confirmText={t('Yes_hide_it')}
				cancelText={t('Cancel')}
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={() => hideRoom.mutate()}
				dontAskAgain={{
					action: 'hideRoom',
					label: t('Hide_room'),
				}}
			>
				{t(warnText as TranslationKey, { roomName: name })}
			</GenericModalDoNotAskAgain>,
		);
	});

	return handleHide;
};
