import { IRoom } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import {
	useVideoConfAcceptCall,
	useVideoConfAbortCall,
	useVideoConfRejectIncomingCall,
	useVideoConfDismissCall,
} from '../../../../../../contexts/VideoConfContext';
import { useHandleRoom } from '../../../../../../lib/RoomManager';
import CallingPopup from './CallingPopup';
import ReceivingPopup from './ReceivingPopup';

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
	const acceptCall = useVideoConfAcceptCall();
	const abortCall = useVideoConfAbortCall();
	const rejectCall = useVideoConfRejectIncomingCall();
	const dismissCall = useVideoConfDismissCall();
	const { value: room } = useHandleRoom(rid);

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

	if (!room) {
		return null;
	}

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

	return null;
};

export default TimedVideoConfPopup;
