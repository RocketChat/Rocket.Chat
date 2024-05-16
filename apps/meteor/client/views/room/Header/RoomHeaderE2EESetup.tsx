import type { IRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import React from 'react';

import DirectRoomHeader from './DirectRoomHeader';
import E2EERoomHeader from './E2EERoomHeader';
import RoomHeader from './RoomHeader';

export type RoomHeaderProps = {
	room: IRoom;
	topic?: string;
	slots: {
		start?: unknown;
		preContent?: unknown;
		insideContent?: unknown;
		posContent?: unknown;
		end?: unknown;
		toolbox?: {
			pre?: unknown;
			content?: unknown;
			pos?: unknown;
		};
	};
};

const RoomHeaderE2EESetup = ({ room, topic = '', slots = {} }: RoomHeaderProps) => {
	const encrypted = Boolean(room.encrypted);
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages');
	const shouldDisplayE2EESetup = encrypted && !unencryptedMessagesAllowed;

	if (shouldDisplayE2EESetup) {
		return <E2EERoomHeader room={room} topic={topic} slots={slots} />;
	}

	if (room.t === 'd' && (room.uids?.length ?? 0) < 3) {
		return <DirectRoomHeader slots={slots} room={room} />;
	}

	return <RoomHeader room={room} topic={topic} slots={slots} />;
};

export default RoomHeaderE2EESetup;
