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
import CallingPopup from './CallingPopup';
import ReceivingPopup from './ReceivingPopup';
import StartCallPopup from './StartCallPopup/StartCallPopup';

export type TimedVideoConfPopupProps = {
	id: string;
	rid: IRoom['_id'];
	isReceiving?: boolean;
	isCalling?: boolean;
	position: number;
	current: number;
	total: number;
	onClose?: (id: string) => void;
};

const TimedVideoConfPopup = ({
	id,
	rid,
	isReceiving = false,
	isCalling = false,
	position,
	current,
	total,
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
		return (
			<ReceivingPopup
				room={room}
				id={id}
				position={position}
				current={current}
				total={total}
				onClose={handleClose}
				onMute={handleMute}
				onConfirm={handleConfirm}
			/>
		);
	}

	if (isCalling) {
		return <CallingPopup room={room} id={id} onClose={handleClose} />;
	}

	return <StartCallPopup loading={starting} room={room} id={id} onClose={dismissOutgoing} onConfirm={handleStartCall} />;
};

export default TimedVideoConfPopup;
