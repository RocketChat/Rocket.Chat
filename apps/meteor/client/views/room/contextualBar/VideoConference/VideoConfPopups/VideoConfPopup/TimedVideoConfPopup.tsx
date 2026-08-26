import { useFocusManager } from '@react-aria/focus';
import type { IRoom } from '@rocket.chat/core-typings';
import { useUserRoom } from '@rocket.chat/ui-contexts';
import {
	useVideoConfAcceptCall,
	useVideoConfAbortCall,
	useVideoConfRejectIncomingCall,
	useVideoConfDismissCall,
	useVideoConfStartCall,
	useVideoConfDismissOutgoing,
} from '@rocket.chat/ui-video-conf';
import { useEffect, useState } from 'react';

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

const TimedVideoConfPopup = ({ id, rid, isReceiving = false, isCalling = false, position }: TimedVideoConfPopupProps) => {
	const [starting, setStarting] = useState(false);
	const acceptCall = useVideoConfAcceptCall();
	const abortCall = useVideoConfAbortCall();
	const rejectCall = useVideoConfRejectIncomingCall();
	const dismissCall = useVideoConfDismissCall();
	const startCall = useVideoConfStartCall();
	const dismissOutgoing = useVideoConfDismissOutgoing();
	const focusManager = useFocusManager();
	const room = useUserRoom(rid);

	// An incoming call can reach a conference member with no access to the room it belongs to, so only the
	// popups that act *on* a room need one. Focusing before anything renders would look for the parent of a
	// node the focus scope never got.
	const hasPopup = isReceiving || Boolean(room);

	useEffect(() => {
		if (!hasPopup) {
			return;
		}

		focusManager?.focusFirst();
	}, [focusManager, hasPopup]);

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

	const handleStartCall = (): void => {
		setStarting(true);
		startCall(rid);
		// The call opens in its own window on this very click, so this popup has nothing left to show — the wait
		// for the other side lives in the call now. A group call closed it by way of `calling/ended`; a direct one
		// keeps ringing and never emits that, which left "Start a call" sitting behind the call it had started.
		dismissOutgoing();
	};

	if (isReceiving) {
		return <IncomingPopup room={room} id={id} position={position} onClose={handleClose} onMute={handleMute} onConfirm={handleConfirm} />;
	}

	if (!room) {
		return null;
	}

	if (isCalling) {
		return <OutgoingPopup room={room} id={id} onClose={handleClose} />;
	}

	return <StartCallPopup loading={starting} room={room} id={id} onClose={dismissOutgoing} onConfirm={handleStartCall} />;
};

export default TimedVideoConfPopup;
