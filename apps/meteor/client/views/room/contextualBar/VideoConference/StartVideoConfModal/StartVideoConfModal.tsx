import { IRoom, isDirectMessageRoom, isMultipleDirectMessageRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import StartDirectVideoConfModal from './StartDirectVideoConfModal';
import StartGroupVideoConfModal from './StartGroupVideoConfModal';

const StartVideoConfModal = ({ room, onClose }: { room: IRoom; onClose: () => void }): ReactElement => {
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();

	if (isDirectMessageRoom(room) && !isMultipleDirectMessageRoom(room) && directUserId) {
		return <StartDirectVideoConfModal room={room} uid={directUserId} onClose={onClose} />;
	}

	return <StartGroupVideoConfModal room={room} onClose={onClose} />;
};

export default StartVideoConfModal;
