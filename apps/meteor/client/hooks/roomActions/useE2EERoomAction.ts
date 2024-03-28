import { isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, usePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { dispatchToastMessage } from '../../lib/toast';
import { useRoom, useRoomSubscription } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useIsE2EEReady } from '../../views/room/hooks/useIsE2EEReady';

export const useE2EERoomAction = () => {
	const enabled = useSetting('E2E_Enable', false);
	const room = useRoom();
	const subscription = useRoomSubscription();
	const isE2EEReady = useIsE2EEReady();
	const readyToEncrypt = isE2EEReady || room.encrypted;
	const permittedToToggleEncryption = usePermission('toggle-room-e2e-encryption', room._id);
	const permittedToEditRoom = usePermission('edit-room', room._id);
	const permitted = (room.t === 'd' || (permittedToEditRoom && permittedToToggleEncryption)) && readyToEncrypt;
	const federated = isRoomFederated(room);
	const { t } = useTranslation();

	const toggleE2E = useEndpoint('POST', '/v1/rooms.saveRoomSettings');

	const action = useMutableCallback(async () => {
		const { success } = await toggleE2E({ rid: room._id, encrypted: !room.encrypted });
		if (!success) {
			return;
		}

		dispatchToastMessage({
			type: 'success',
			message: room.encrypted
				? t('E2E_Encryption_disabled_for_room', { roomName: room.name })
				: t('E2E_Encryption_enabled_for_room', { roomName: room.name }),
		});

		if (subscription?.autoTranslate) {
			dispatchToastMessage({ type: 'success', message: t('AutoTranslate_Disabled_for_room', { roomName: room.name }) });
		}
	});

	const enabledOnRoom = !!room.encrypted;

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
