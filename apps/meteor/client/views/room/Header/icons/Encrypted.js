import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useSetting, usePermission, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import Header from '../../../../components/Header';

const Encrypted = ({ room }) => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const toggleE2E = useMethod('saveRoomSettings');
	const canToggleE2E = usePermission('toggle-room-e2e-encryption');
	const encryptedLabel = canToggleE2E ? t('Encrypted_key_title') : t('Encrypted');
	const handleE2EClick = useMutableCallback(() => {
		if (!canToggleE2E) {
			return;
		}
		toggleE2E(room._id, 'encrypted', !(room && room.encrypted));
	});
	return e2eEnabled && room?.encrypted ? (
		<Header.State title={encryptedLabel} icon='key' onClick={handleE2EClick} color={colors.g500} tiny ghost />
	) : null;
};

export default memo(Encrypted);
