import type { IRoom } from '@rocket.chat/core-typings';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState } from 'react';

import { e2e } from '../../../app/e2e/client';
import { E2ERoomState } from '../../../app/e2e/client/E2ERoomState';
import RoomE2EENotAllowed from './RoomE2EENotAllowed';
import RoomBody from './body/RoomBody';
import { useE2EERoomState } from './hooks/useE2EERoomState';
import { useIsE2EEReady } from './hooks/useIsE2EEReady';

const RoomBodyChecks = ({ room }: { room: IRoom }) => {
	const [randomPassword, setRandomPassword] = useState(window.localStorage.getItem('e2e.randomPassword') || undefined);
	const areUnencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages');
	const e2eRoomState = useE2EERoomState(room._id);
	const isE2EEReady = useIsE2EEReady();
	const shouldAskForE2EEPassword = e2e.shouldAskForE2EEPassword();
	const t = useTranslation();

	const onSavePassword = useCallback(() => {
		if (!randomPassword) {
			return;
		}
		e2e.openSaveE2EEPasswordModal(randomPassword, () => setRandomPassword(undefined));
	}, [randomPassword, setRandomPassword]);

	const onEnterE2EEPassword = useCallback(() => e2e.decodePrivateKeyFromOutside(), []);

	if (!room?.encrypted) {
		return <RoomBody />;
	}

	if (
		areUnencryptedMessagesAllowed ||
		(e2eRoomState === E2ERoomState.READY && isE2EEReady && !areUnencryptedMessagesAllowed && !randomPassword)
	) {
		return <RoomBody />;
	}

	if (randomPassword) {
		return (
			<RoomE2EENotAllowed
				title={t('__roomName__is_encrypted', { roomName: room.name })}
				subTitle={t('Save_your_encryption_password_to_access')}
				icon='key'
				action={onSavePassword}
				btnText={t('Save_E2EE_password')}
			/>
		);
	}

	if (shouldAskForE2EEPassword) {
		return (
			<RoomE2EENotAllowed
				title={t('__roomName__is_encrypted', { roomName: room.name })}
				subTitle={t('Enter_your_E2E_password_to_access')}
				icon='key'
				action={onEnterE2EEPassword}
				btnText={t('Enter_your_E2E_password')}
			/>
		);
	}

	if (e2eRoomState === E2ERoomState.WAITING_KEYS) {
		return (
			<RoomE2EENotAllowed
				title={t('Check_back_later')}
				subTitle={t('__roomName__encryption_keys_need_to_be_updated', { roomName: room.name })}
				icon='clock'
			/>
		);
	}

	return <RoomBody />;
};

export default RoomBodyChecks;
