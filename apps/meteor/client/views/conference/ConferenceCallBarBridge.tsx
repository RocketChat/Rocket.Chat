import { useMediaCallView } from '@rocket.chat/ui-voip';
import { useEffect } from 'react';

import { STATE_HEARTBEAT_MS, onCallCommand, publishCallEnded, publishCallState } from '../videoConference/livekit/callBarChannel';

type ConferenceCallBarBridgeProps = {
	callId: string;
	rid: string;
	roomName: string;
	unreadCount?: number;
};

/**
 * Conference-window side of the in-app call bar: broadcasts the live call
 * state over the BroadcastChannel (heartbeat + on change) and executes
 * commands sent back by the main window's bar (mute, camera, share, hand,
 * hangup, focus). Renders nothing.
 */
const ConferenceCallBarBridge = ({ callId, rid, roomName }: ConferenceCallBarBridgeProps) => {
	const view = useMediaCallView();
	const { sessionState, streams, onMute, onToggleCamera, onToggleScreenSharing, onToggleHand, localHandRaised, onEndCall } = view;

	const { muted } = sessionState;
	const camOn = streams.localCamera?.active ?? false;
	const sharing = streams.localScreen?.active ?? false;
	const handRaised = Boolean(localHandRaised);
	const startedAt = sessionState.startedAt ? new Date(sessionState.startedAt).toISOString() : undefined;
	const ongoing = sessionState.state === 'ongoing';

	// Broadcast on every relevant change + a heartbeat so other windows can
	// expire the bar if this window dies without saying goodbye.
	useEffect(() => {
		if (!ongoing) {
			return;
		}
		const publish = () => publishCallState({ callId, rid, roomName, muted, camOn, sharing, handRaised, startedAt, ts: Date.now() });
		publish();
		const interval = setInterval(publish, STATE_HEARTBEAT_MS);
		return () => clearInterval(interval);
	}, [ongoing, callId, rid, roomName, muted, camOn, sharing, handRaised, startedAt]);

	// Goodbye on call end, unmount, or window close.
	useEffect(() => {
		if (!ongoing) {
			return;
		}
		const sayGoodbye = () => publishCallEnded(callId);
		window.addEventListener('pagehide', sayGoodbye);
		return () => {
			window.removeEventListener('pagehide', sayGoodbye);
			sayGoodbye();
		};
	}, [ongoing, callId]);

	useEffect(() => {
		if (!ongoing) {
			return;
		}
		return onCallCommand((commandCallId, action) => {
			if (commandCallId !== callId) {
				return;
			}
			switch (action) {
				case 'toggleMic':
					onMute();
					break;
				case 'toggleCam':
					onToggleCamera?.();
					break;
				case 'toggleShare':
					onToggleScreenSharing();
					break;
				case 'toggleHand':
					onToggleHand?.();
					break;
				case 'hangup':
					onEndCall();
					break;
				case 'focus':
					window.focus();
					break;
			}
		});
	}, [ongoing, callId, onMute, onToggleCamera, onToggleScreenSharing, onToggleHand, onEndCall]);

	return null;
};

export default ConferenceCallBarBridge;
