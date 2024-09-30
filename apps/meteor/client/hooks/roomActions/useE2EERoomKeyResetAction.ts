import { isRoomFederated } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetting, usePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { e2e } from '../../../app/e2e/client';
import { E2EEState } from '../../../app/e2e/client/E2EEState';
import { OtrRoomState } from '../../../app/otr/lib/OtrRoomState';
import { dispatchToastMessage } from '../../lib/toast';
import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useE2EEState } from '../../views/room/hooks/useE2EEState';
import { useOTR } from '../useOTR';

// Temporal hook for testing whole flow
export const useE2EEResetRoomKeyRoomAction = () => {
	const enabled = useSetting('E2E_Enable', false);
	const room = useRoom();
	const e2eeState = useE2EEState();
	const isE2EEReady = e2eeState === E2EEState.READY || e2eeState === E2EEState.SAVE_PASSWORD;
	const readyToEncrypt = isE2EEReady || room.encrypted;
	const permittedToEditRoom = usePermission('edit-room', room._id);
	const permitted = (room.t === 'd' || permittedToEditRoom) && readyToEncrypt;
	const federated = isRoomFederated(room);
	const { t } = useTranslation();
	const { otrState } = useOTR();
	const resetRoomKey = useEndpoint('POST', '/v1/e2e.resetRoomKey');

	const action = useEffectEvent(async () => {
		if (otrState === OtrRoomState.ESTABLISHED || otrState === OtrRoomState.ESTABLISHING || otrState === OtrRoomState.REQUESTED) {
			dispatchToastMessage({ type: 'error', message: t('E2EE_not_available_OTR') });

			return;
		}

		const e2eRoom = await e2e.getInstanceByRoomId(room._id);

		if (!e2eRoom) {
			return;
		}

		const { e2eKey, e2eKeyId } = await e2eRoom.resetRoomKey();

		if (!e2eKey) {
			throw new Error('cannot reset room key');
		}

		try {
			await resetRoomKey({ rid: room._id, e2eKeyId, e2eKey });

			dispatchToastMessage({
				type: 'success',
				message: 'Room Key reset successfully',
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled || !permitted) {
			return undefined;
		}

		return {
			id: 'e2e-reset',
			groups: ['direct', 'direct_multiple', 'group', 'team'],
			title: 'E2E_Key_Reset',
			icon: 'key',
			order: 14,
			action,
			type: 'organization',
			...(federated && {
				tooltip: t('core.E2E_unavailable_for_federation'),
				disabled: true,
			}),
		};
	}, [enabled, permitted, federated, t, action]);
};
