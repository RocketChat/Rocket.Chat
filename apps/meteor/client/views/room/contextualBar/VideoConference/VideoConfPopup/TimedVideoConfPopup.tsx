import { IRoom } from '@rocket.chat/core-typings';
import React, { useEffect, ReactElement } from 'react';

import {
	useVideoConfPopupDismiss,
	useAcceptCall,
	useAbortCall,
	useRejectIncomingCall,
	useMuteCall,
} from '../../../../../contexts/VideoConfPopupContext';
import { useHandleRoom } from '../../../../../lib/RoomManager';
import CallingPopup from './CallingPopup';
import ReceivingPopup from './ReceivingPopup';

export type TimedVideoConfPopupProps = {
	id: string;
	rid: IRoom['_id'];
	isReceiving?: boolean;
	position: number;
	current: number;
	total: number;
	onClose?: (id: string) => void;
};

const TimedVideoConfPopup = ({ id, rid, isReceiving = false, position, current, total }: TimedVideoConfPopupProps): ReactElement | null => {
	const dismissPopup = useVideoConfPopupDismiss();
	const acceptCall = useAcceptCall();
	const abortCall = useAbortCall();
	const rejectCall = useRejectIncomingCall();
	const muteCall = useMuteCall();
	const { value: room } = useHandleRoom(rid);

	useEffect(() => {
		setTimeout(() => {
			dismissPopup(id);
		}, 30000);
	}, [dismissPopup, id]);

	const handleConfirm = (): void => {
		acceptCall(id);
		dismissPopup(id);
	};

	const handleClose = (id: string): void => {
		if (isReceiving) {
			rejectCall(id);
			dismissPopup(id);
			return;
		}

		abortCall();
		dismissPopup(id);
	};

	const handleMute = (id: string): void => {
		dismissPopup(id);
		muteCall();
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

	return <CallingPopup room={room} id={id} onClose={handleClose} />;
};

export default TimedVideoConfPopup;
