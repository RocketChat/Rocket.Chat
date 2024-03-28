import type { IRoom } from '@rocket.chat/core-typings';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { e2e } from '../../../app/e2e/client';
import { E2EEState } from '../../../app/e2e/client/E2EEState';
import { E2ERoomState } from '../../../app/e2e/client/E2ERoomState';
import RoomE2EENotAllowed from './RoomE2EENotAllowed';
import RoomBody from './body/RoomBody';
import { useE2EERoomState } from './hooks/useE2EERoomState';
import { useE2EEState } from './hooks/useE2EEState';
import { useIsE2EEReady } from './hooks/useIsE2EEReady';

const RoomBodyWithE2EESetup = ({ room }: { room: IRoom }) => {
	const areUnencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages');
	const e2eRoomState = useE2EERoomState(room._id);
	const e2eeState = useE2EEState();
	const isE2EEReady = useIsE2EEReady();
	const t = useTranslation();
	const randomPassword = window.localStorage.getItem('e2e.randomPassword');

	const onSavePassword = useCallback(() => {
		if (!randomPassword) {
			return;
		}

		e2e.openSaveE2EEPasswordModal(randomPassword);
	}, [randomPassword]);

	const onEnterE2EEPassword = useCallback(() => e2e.decodePrivateKeyFlow(), []);

	if (!room?.encrypted) {
		return <RoomBody />;
	}

	if (areUnencryptedMessagesAllowed || (e2eRoomState === E2ERoomState.READY && isE2EEReady && !areUnencryptedMessagesAllowed)) {
		return <RoomBody />;
	}

	if (e2eeState === E2EEState.SAVE_PASSWORD) {
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

	if (e2eeState === E2EEState.ENTER_PASSWORD) {
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

export default RoomBodyWithE2EESetup;
