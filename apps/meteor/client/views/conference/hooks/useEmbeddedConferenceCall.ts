import { useEffect, useRef } from 'react';

import type { CallDevices, CallPreferences } from './useCallPreferences';
import { useOptionalLiveKitVideoConf } from '../../videoConference/livekit/LiveKitVideoConfContext';

type EmbeddedConferenceCall = {
	callId: string;
	/** The room the call belongs to, which is what the provider names its own room after. */
	rid: string | undefined;
	/** Whether the provider runs the call in here rather than at a URL of its own. */
	embedded: boolean;
	preferences?: CallPreferences;
	/** Which devices to arrive on. This provider can be told, so it is told. */
	devices?: CallDevices;
	/**
	 * The call ended for this user — they hung up, or it ended under them. The window exists for the call, so
	 * this is what closes it.
	 */
	onEnded?: () => void;
};

/**
 * Hands a joined embedded call to the tree that actually renders it.
 *
 * An embedded provider has no URL to open — the call is mounted by a provider tree that lives *above* this
 * window's route (`LiveKitVideoConfBridge`, in `MeteorProvider`), so joining here has to tell that tree which
 * call to connect to. Registering it up there rather than holding it in this page is what lets the connection
 * survive the page re-rendering, and it is the same slot the in-room path uses, so a call is never claimed
 * twice.
 *
 * Leaving the page hands the call back. That is the honest thing for this window to do: closing it *is*
 * leaving the call, which is exactly what `useLeaveConferenceOnClose` already reports to the server.
 */
export const useEmbeddedConferenceCall = ({ callId, rid, embedded, preferences, devices, onEnded }: EmbeddedConferenceCall): void => {
	const liveKit = useOptionalLiveKitVideoConf();
	const joinCall = liveKit?.joinCall;
	const leaveCall = liveKit?.leaveCall;
	const activeCallId = liveKit?.activeCall?.callId;

	const mic = preferences?.mic;
	const cam = preferences?.cam;
	const { micId, camId, speakerId } = devices ?? {};

	useEffect(() => {
		if (!embedded || !rid || !joinCall) {
			return;
		}

		joinCall({ callId, rid, preferences: { mic, cam, micId, camId, speakerId } });

		return () => leaveCall?.();
	}, [callId, rid, embedded, mic, cam, micId, camId, speakerId, joinCall, leaveCall]);

	// The slot is empty before the join above lands, so emptiness only means "ended" once it has held this call.
	// Without that, the first render would read as the call being over the moment the window opened.
	const wasActive = useRef(false);

	useEffect(() => {
		if (activeCallId === callId) {
			wasActive.current = true;
			return;
		}

		if (wasActive.current && !activeCallId) {
			wasActive.current = false;
			onEnded?.();
		}
	}, [activeCallId, callId, onEnded]);
};
