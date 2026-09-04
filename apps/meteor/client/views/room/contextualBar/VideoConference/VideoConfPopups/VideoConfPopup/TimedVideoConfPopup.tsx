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
import { useConferenceWindowEnabled } from '../../../../../conference/hooks/useConferenceWindowEnabled';

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
	const conferenceWindowEnabled = useConferenceWindowEnabled();

	// Whether anything renders below at all — the same condition, so the two cannot drift. Focusing when nothing
	// does looks for the parent of a node the focus scope never got, and throws.
	//
	// An incoming call needs no room only with the call window, where it can reach a conference member who has no
	// access to the room it belongs to. Without it, a popup with no room renders nothing, as it always did.
	const hasPopup = Boolean(room) || (conferenceWindowEnabled && isReceiving);

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

		if (!conferenceWindowEnabled) {
			return;
		}

		// The call opens in its own window on this very click, so this popup has nothing left to show — the wait
		// for the other side lives in the call now. A group call closed it by way of `calling/ended`; a direct one
		// keeps ringing and never emits that, which left "Start a call" sitting behind the call it had started.
		// Without a call window the wait is still here, in the outgoing popup this would close.
		dismissOutgoing();
	};

	// Without the call window every popup is about a room, so there is nothing to show until it is there — which
	// is what this rendered before an incoming call could arrive for a room the user cannot see.
	if (!room && !conferenceWindowEnabled) {
		return null;
	}

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
