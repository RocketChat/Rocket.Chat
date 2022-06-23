import { IRoom, isDirectMessageRoom, isMultipleDirectMessageRoom, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { VideoConfManager } from '../../../../../lib/VideoConfManager';
import StartDirectVideoConfModal from './StartDirectVideoConfModal';
import StartGroupVideoConfModal from './StartGroupVideoConfModal';
import StartOmnichannelVideoConfModal from './StartOmnichannelVideoConfModal';

type StartVideoConfModalProps = {
	room: IRoom;
	onClose: () => void;
	onConfirm: (title?: string) => void;
};

const StartVideoConfModal = ({ room, onClose, onConfirm }: StartVideoConfModalProps): ReactElement => {
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();

	VideoConfManager.loadCapabilities();

	if (isDirectMessageRoom(room) && !isMultipleDirectMessageRoom(room) && directUserId) {
		return <StartDirectVideoConfModal room={room} uid={directUserId} onClose={onClose} onConfirm={onConfirm} />;
	}

	if (isOmnichannelRoom(room)) {
		return <StartOmnichannelVideoConfModal room={room} onClose={onClose} onConfirm={onConfirm} />;
	}

	return <StartGroupVideoConfModal room={room} onClose={onClose} onConfirm={onConfirm} />;
};

export default StartVideoConfModal;
