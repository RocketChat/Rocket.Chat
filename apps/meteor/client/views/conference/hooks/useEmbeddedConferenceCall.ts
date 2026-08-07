import { useEffect } from 'react';

import type { CallPreferences } from './useCallPreferences';
import { useOptionalLiveKitVideoConf } from '../../videoConference/livekit/LiveKitVideoConfContext';

type EmbeddedConferenceCall = {
	callId: string;
	/** The room the call belongs to, which is what the provider names its own room after. */
	rid: string | undefined;
	/** Whether the provider runs the call in here rather than at a URL of its own. */
	embedded: boolean;
	preferences?: CallPreferences;
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
export const useEmbeddedConferenceCall = ({ callId, rid, embedded, preferences }: EmbeddedConferenceCall): void => {
	const liveKit = useOptionalLiveKitVideoConf();
	const joinCall = liveKit?.joinCall;
	const leaveCall = liveKit?.leaveCall;

	const mic = preferences?.mic;
	const cam = preferences?.cam;

	useEffect(() => {
		if (!embedded || !rid || !joinCall) {
			return;
		}

		joinCall({ callId, rid, preferences: { mic, cam } });

		return () => leaveCall?.();
	}, [callId, rid, embedded, mic, cam, joinCall, leaveCall]);
};
