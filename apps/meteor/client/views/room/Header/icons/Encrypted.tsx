import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { HeaderState } from '@rocket.chat/ui-client';
import { useSetting, usePermission, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

const Encrypted = ({ room }: { room: IRoom }) => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const toggleE2E = useMethod('saveRoomSettings');
	const canToggleE2E = usePermission('toggle-room-e2e-encryption');
	const encryptedLabel = canToggleE2E ? t('Encrypted_key_title') : t('Encrypted');
	const handleE2EClick = useMutableCallback(() => {
		if (!canToggleE2E) {
			return;
		}
		toggleE2E(room._id, 'encrypted', !room?.encrypted);
	});
	return e2eEnabled && room?.encrypted ? (
		<HeaderState title={encryptedLabel} icon='key' onClick={handleE2EClick} color={colors.s500} tiny />
	) : null;
};

export default memo(Encrypted);
