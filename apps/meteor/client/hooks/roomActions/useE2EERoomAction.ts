import { isRoomFederated } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { imperativeModal } from '@rocket.chat/ui-client';
import { useSetting, usePermission, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getRoomTypeTranslation } from '../../lib/getRoomTypeTranslation';
import { useRoom, useRoomSubscription } from '../../views/room/contexts/RoomContext';
import { useE2EERoomState } from '../../views/room/hooks/useE2EERoomState';
import { useE2EEState } from '../../views/room/hooks/useE2EEState';
import BaseDisableE2EEModal from '../../views/room/modals/E2EEModals/BaseDisableE2EEModal';
import EnableE2EEModal from '../../views/room/modals/E2EEModals/EnableE2EEModal';

export const useE2EERoomAction = () => {
	const enabled = useSetting('E2E_Enable', false);
	const room = useRoom();
	const subscription = useRoomSubscription();
	const e2eeState = useE2EEState();
	const e2eeRoomState = useE2EERoomState(room._id);
	const isE2EEReady = e2eeState === 'READY' || e2eeState === 'SAVE_PASSWORD';
	const readyToEncrypt = isE2EEReady || room.encrypted;
	const permittedToToggleEncryption = usePermission('toggle-room-e2e-encryption', room._id);
	const permittedToEditRoom = usePermission('edit-room', room._id);
	const permitted = (room.t === 'd' || (permittedToEditRoom && permittedToToggleEncryption)) && readyToEncrypt;
	const federated = isRoomFederated(room);
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const isE2EERoomNotReady = () => {
		if (e2eeRoomState === 'NOT_STARTED' || e2eeRoomState === 'DISABLED' || e2eeRoomState === 'ERROR' || e2eeRoomState === 'WAITING_KEYS') {
			return true;
		}

		return false;
	};

	const enabledOnRoom = !!room.encrypted;

	const roomType = useMemo(() => getRoomTypeTranslation(room)?.toLowerCase(), [room]);

	const roomId = room._id;

	const toggleE2E = useEndpoint('POST', '/v1/rooms.saveRoomSettings');

	const canResetRoomKey = enabled && isE2EEReady && (room.t === 'd' || permittedToToggleEncryption) && isE2EERoomNotReady();

	const action = useEffectEvent(async () => {
		if (enabledOnRoom) {
			imperativeModal.open({
				component: BaseDisableE2EEModal,
				props: {
					onClose: imperativeModal.close,
					onConfirm: handleToogleE2E,
					roomType,
					roomId,
					canResetRoomKey,
				},
			});
		} else {
			imperativeModal.open({
				component: EnableE2EEModal,
				props: {
					onClose: imperativeModal.close,
					onConfirm: handleToogleE2E,
					roomType,
				},
			});
		}
	});

	const handleToogleE2E = async () => {
		const { success } = await toggleE2E({ rid: room._id, encrypted: !room.encrypted });
		if (!success) {
			return;
		}

		imperativeModal.close();

		dispatchToastMessage({
			type: 'success',
			message: room.encrypted
				? t('E2E_Encryption_disabled_for_room', { roomName: room.name })
				: t('E2E_Encryption_enabled_for_room', { roomName: room.name }),
		});

		if (subscription?.autoTranslate) {
			dispatchToastMessage({ type: 'success', message: t('AutoTranslate_Disabled_for_room', { roomName: room.name }) });
		}
	};

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled || !permitted) {
			return undefined;
		}

		return {
			id: 'e2e',
			groups: ['direct', 'direct_multiple', 'group', 'team'],
			title: enabledOnRoom ? 'Disable_E2E_encryption' : 'Enable_E2E_encryption',
			icon: 'key',
			order: 13,
			action,
			type: 'organization',
			...(federated && {
				tooltip: t('core.E2E_unavailable_for_federation'),
				disabled: true,
			}),
		};
	}, [enabled, permitted, federated, t, enabledOnRoom, action]);
};
