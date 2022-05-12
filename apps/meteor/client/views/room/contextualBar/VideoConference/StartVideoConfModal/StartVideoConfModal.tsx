import { IRoom, isDirectMessageRoom, isMultipleDirectMessageRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import StartDirectVideoConfModal from './StartDirectVideoConfModal';
import StartGroupVideoConfModal from './StartGroupVideoConfModal';

type StartVideoConfModalProps = {
	room: IRoom;
	onClose: () => void;
	onConfirm: () => void;
};

const StartVideoConfModal = ({ room, onClose, onConfirm }: StartVideoConfModalProps): ReactElement => {
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();

	if (isDirectMessageRoom(room) && !isMultipleDirectMessageRoom(room) && directUserId) {
		return <StartDirectVideoConfModal room={room} uid={directUserId} onClose={onClose} onConfirm={onConfirm} />;
	}

	return <StartGroupVideoConfModal room={room} onClose={onClose} onConfirm={onConfirm} />;
};

export default StartVideoConfModal;
