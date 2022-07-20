import { IRoom } from '@rocket.chat/core-typings';
import { useUserRoom } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useState } from 'react';

import {
	useVideoConfAcceptCall,
	useVideoConfAbortCall,
	useVideoConfRejectIncomingCall,
	useVideoConfDismissCall,
	useVideoConfStartCall,
	useVideoConfDismissOutgoing,
} from '../../../../../../contexts/VideoConfContext';
import IncomingPopup from './IncomingPopup';
import OutgoingPopup from './OutgoingPopup';
import StartCallPopup from './StartCallPopup';

export type TimedVideoConfPopupProps = {
	id: string;
	rid: IRoom['_id'];
	isReceiving?: boolean;
	isCalling?: boolean;
	position: number;
	onClose?: (id: string) => void;
};

const TimedVideoConfPopup = ({
	id,
	rid,
	isReceiving = false,
	isCalling = false,
	position,
}: TimedVideoConfPopupProps): ReactElement | null => {
	const [starting, setStarting] = useState(false);
	const acceptCall = useVideoConfAcceptCall();
	const abortCall = useVideoConfAbortCall();
	const rejectCall = useVideoConfRejectIncomingCall();
	const dismissCall = useVideoConfDismissCall();
	const startCall = useVideoConfStartCall();
	const dismissOutgoing = useVideoConfDismissOutgoing();
	const room = useUserRoom(rid);

	if (!room) {
		return null;
	}

	const handleConfirm = (): void => {
		acceptCall(id);
	};

	const handleClose = (id: string): void => {
		if (isReceiving) {
			rejectCall(id);
			return;
		}

		abortCall();
	};

	const handleMute = (): void => {
		dismissCall(id);
	};

	const handleStartCall = async (): Promise<void> => {
		setStarting(true);
		startCall(rid);
	};

	if (isReceiving) {
		return <IncomingPopup room={room} id={id} position={position} onClose={handleClose} onMute={handleMute} onConfirm={handleConfirm} />;
	}

	if (isCalling) {
		return <OutgoingPopup room={room} id={id} onClose={handleClose} />;
	}

	return <StartCallPopup loading={starting} room={room} id={id} onClose={dismissOutgoing} onConfirm={handleStartCall} />;
};

export default TimedVideoConfPopup;
