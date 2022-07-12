import { IRoom, isDirectMessageRoom, isMultipleDirectMessageRoom, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useMutableCallback, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useVideoConfControllers } from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useRef } from 'react';

import { useVideoConfSetPreferences, useVideoConfPreferences } from '../../../../../../../contexts/VideoConfContext';
import StartDirectCallPopup from './StartDirectCallPopup';
import StartGroupCallPopup from './StartGroupCallPopup';
import StartOmnichannelCallPopup from './StartOmnichannelCallPopup';

type StartCallPopup = {
	id: string;
	room: IRoom;
	onClose: () => void;
	onConfirm: () => void;
	loading: boolean;
};

const StartCallPopup = ({ loading, room, onClose, onConfirm }: StartCallPopup): ReactElement => {
	const ref = useRef<HTMLDivElement>(null);
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const videoConfPreferences = useVideoConfPreferences();
	const setPreferences = useVideoConfSetPreferences();
	const { controllersConfig } = useVideoConfControllers(videoConfPreferences);

	useOutsideClick([ref], !loading ? onClose : (): void => undefined);

	const handleStartCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	if (isDirectMessageRoom(room) && !isMultipleDirectMessageRoom(room) && directUserId) {
		return <StartDirectCallPopup loading={loading} ref={ref} room={room} onConfirm={handleStartCall} />;
	}

	if (isOmnichannelRoom(room)) {
		return <StartOmnichannelCallPopup ref={ref} room={room} onConfirm={onConfirm} />;
	}

	return <StartGroupCallPopup loading={loading} ref={ref} room={room} onConfirm={handleStartCall} />;
};

export default StartCallPopup;
