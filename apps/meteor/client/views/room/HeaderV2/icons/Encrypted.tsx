import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useSetting, usePermission, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { HeaderState } from '../../../../components/Header';
import { dispatchToastMessage } from '../../../../lib/toast';

const Encrypted = ({ room }: { room: IRoom }) => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const toggleE2E = useEndpoint('POST', '/v1/rooms.saveRoomSettings');
	const canToggleE2E = usePermission('toggle-room-e2e-encryption');
	const encryptedLabel = canToggleE2E ? t('Encrypted_key_title') : t('Encrypted');
	const handleE2EClick = useMutableCallback(async () => {
		if (!canToggleE2E) {
			return;
		}

		const { success } = await toggleE2E({ rid: room._id, encrypted: !room.encrypted });
		if (!success) {
			return;
		}

		dispatchToastMessage({
			type: 'success',
			message: t('E2E_Encryption_disabled_for_room', { roomName: room.name }),
		});
	});
	return e2eEnabled && room?.encrypted ? (
		<HeaderState title={encryptedLabel} icon='key' onClick={handleE2EClick} color={colors.g500} tiny />
	) : null;
};

export default memo(Encrypted);
