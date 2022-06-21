import { IRoom, isDirectMessageRoom, isMultipleDirectMessageRoom, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useEndpointData } from '../../../../../hooks/useEndpointData';
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

	const { value: data } = useEndpointData('/v1/video-conference.capabilities');

	const showMic = Boolean(data?.capabilities?.mic);
	const showCam = Boolean(data?.capabilities?.cam);

	if (isDirectMessageRoom(room) && !isMultipleDirectMessageRoom(room) && directUserId) {
		return (
			<StartDirectVideoConfModal
				room={room}
				uid={directUserId}
				onClose={onClose}
				onConfirm={onConfirm}
				showMic={showMic}
				showCam={showCam}
			/>
		);
	}

	if (isOmnichannelRoom(room)) {
		return <StartOmnichannelVideoConfModal room={room} onClose={onClose} onConfirm={onConfirm} />;
	}

	return <StartGroupVideoConfModal room={room} onClose={onClose} onConfirm={onConfirm} showMic={showMic} showCam={showCam} />;
};

export default StartVideoConfModal;
