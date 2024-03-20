import type { IRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState } from 'react';

import { e2e } from '../../../app/e2e/client';
import { E2ERoomState } from '../../../app/e2e/client/E2ERoomState';
import RoomE2EENotAllowed from './RoomE2EENotAllowed';
import RoomE2EEWaitingKeys from './RoomE2EEWaitingKeys';
import RoomBody from './body/RoomBody';
import { useE2EERoomState } from './hooks/useE2EERoomState';
import { useIsE2EEReady } from './hooks/useIsE2EEReady';

const RoomBodyChecks = ({ room }: { room: IRoom }) => {
	const [randomPassword, setRandomPassword] = useState(window.localStorage.getItem('e2e.randomPassword') || undefined);
	const areUnencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages');
	const allowE2EERoom = !room?.encrypted || (room?.encrypted && areUnencryptedMessagesAllowed);
	const e2eRoomState = useE2EERoomState(room._id);
	const isE2EEReady = useIsE2EEReady();
	const shouldAskForE2EEPassword = e2e.shouldAskForE2EEPassword();
	// const e2eRoom = useE2EERoom(room._id);
	// const e2eRoomState = useE2EERoomState(e2eRoom);

	console.log({ shouldAskForE2EEPassword });

	const onSavePassword = useCallback(() => {
		if (!randomPassword) {
			return;
		}
		e2e.openSaveE2EEPasswordModal(randomPassword, () => setRandomPassword(undefined));
	}, [randomPassword, setRandomPassword]);

	const onEnterE2EEPassword = useCallback(() => e2e.decodePrivateKeyFromOutside(), []);

	console.log({
		areUnencryptedMessagesAllowed,
		allowE2EERoom,
		e2eRoomState,
		isE2EEReady,
	});

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
			<RoomE2EENotAllowed title='save e2e password' subTitle='save e2e password' action={onSavePassword} btnText='save e2ee password' />
		);
	}

	if (shouldAskForE2EEPassword) {
		return (
			<RoomE2EENotAllowed
				title='enter e2e password'
				subTitle='enter e2e password'
				action={onEnterE2EEPassword}
				btnText='enter e2ee password'
			/>
		);
	}

	if (e2eRoomState === E2ERoomState.WAITING_KEYS) {
		return <RoomE2EEWaitingKeys />;
	}

	return <RoomBody />;
};

export default RoomBodyChecks;
