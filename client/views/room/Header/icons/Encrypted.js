import React, { memo } from 'react';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useMethod } from '../../../../contexts/ServerContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import Header from '../../../../components/Header';

const Encrypted = ({ room }) => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const toggleE2E = useMethod('saveRoomSettings');
	const encryptedLabel = t('Encrypted');
	const handleE2EClick = useMutableCallback(() => {
		toggleE2E(room._id, 'encrypted', !(room && room.encrypted));
	});
	return e2eEnabled && room?.encrypted ? <Header.State title={encryptedLabel} icon='key' onClick={handleE2EClick} color={colors.g500} tiny ghost/> : null;
};

export default memo(Encrypted);
