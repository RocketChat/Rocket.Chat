import { isRoomFederated } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetting, usePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { E2EEState } from '../../../app/e2e/client/E2EEState';
import { E2ERoomState } from '../../../app/e2e/client/E2ERoomState';
import { OtrRoomState } from '../../../app/otr/lib/OtrRoomState';
import { getRoomTypeTranslation } from '../../lib/getRoomTypeTranslation';
import { imperativeModal } from '../../lib/imperativeModal';
import { dispatchToastMessage } from '../../lib/toast';
import { useRoom, useRoomSubscription } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useE2EERoomState } from '../../views/room/hooks/useE2EERoomState';
import { useE2EEState } from '../../views/room/hooks/useE2EEState';
import BaseDisableE2EEModal from '../../views/room/modals/E2EEModals/BaseDisableE2EEModal';
import EnableE2EEModal from '../../views/room/modals/E2EEModals/EnableE2EEModal';
import { useOTR } from '../useOTR';

export const useE2EERoomAction = () => {
	const enabled = useSetting('E2E_Enable', false);
	const room = useRoom();
	const subscription = useRoomSubscription();
	const e2eeState = useE2EEState();
	const e2eeRoomState = useE2EERoomState(room._id);
	const isE2EEReady = e2eeState === E2EEState.READY || e2eeState === E2EEState.SAVE_PASSWORD;
	const readyToEncrypt = isE2EEReady || room.encrypted;
	const permittedToToggleEncryption = usePermission('toggle-room-e2e-encryption', room._id);
	const permittedToEditRoom = usePermission('edit-room', room._id);
	const permitted = (room.t === 'd' || (permittedToEditRoom && permittedToToggleEncryption)) && readyToEncrypt;
	const federated = isRoomFederated(room);
	const { t } = useTranslation();
	const { otrState } = useOTR();

	const isE2EERoomNotReady = () => {
		if (
			e2eeRoomState === E2ERoomState.NO_PASSWORD_SET ||
			e2eeRoomState === E2ERoomState.NOT_STARTED ||
			e2eeRoomState === E2ERoomState.DISABLED ||
			e2eeRoomState === E2ERoomState.ERROR ||
			e2eeRoomState === E2ERoomState.WAITING_KEYS
		) {
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
		if (otrState === OtrRoomState.ESTABLISHED || otrState === OtrRoomState.ESTABLISHING || otrState === OtrRoomState.REQUESTED) {
			dispatchToastMessage({ type: 'error', message: t('E2EE_not_available_OTR') });

			return;
		}

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
			title: enabledOnRoom ? 'E2E_disable' : 'E2E_enable',
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
