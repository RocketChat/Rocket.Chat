import type { RoomType } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetModal, useToastMessageDispatch, useRouter, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useDontAskAgain } from './useDontAskAgain';
import { Subscriptions } from '../../app/models/client';
import { UiTextContext } from '../../definition/IRoomTypeConfig';
import { GenericModalDoNotAskAgain } from '../components/GenericModal';
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
	l: '/v1/groups.close', // livechat
} as const;

export const useHideRoomAction = ({ rid, type, name }: HideRoomProps, { redirect = true }: HideRoomOptions = {}) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const closeModal = useEffectEvent(() => setModal());
	const dispatchToastMessage = useToastMessageDispatch();
	const dontAskHideRoom = useDontAskAgain('hideRoom');
	const router = useRouter();
	const userId = useUserId();

	const hideRoomEndpoint = useEndpoint('POST', CLOSE_ENDPOINTS_BY_ROOM_TYPE[type]);

	const hideRoom = useMutation({
		mutationFn: () => hideRoomEndpoint({ roomId: rid }),
		onMutate: async () => {
			closeModal();

			const ogDocument = await Subscriptions.findOne({ rid, 'u._id': userId }, { fields: { alert: 1, open: 1 } });

			// Optmistic update
			await Subscriptions.update({ rid, 'u._id': userId }, { $set: { alert: false, open: false } });

			return { ogDocument };
		},
		onSuccess: () => {
			if (redirect) {
				router.navigate('/home');
			}
		},
		onError: (error, _, context) => {
			dispatchToastMessage({ type: 'error', message: error });

			// Revert optimistic changes
			if (context?.ogDocument) {
				const { alert, open } = context.ogDocument;
				Subscriptions.update({ rid, 'u._id': userId }, { $set: { alert, open } });
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
				{t(warnText as TranslationKey, { postProcess: 'sprintf', sprintf: [name] })}
			</GenericModalDoNotAskAgain>,
		);
	});

	return handleHide;
};
