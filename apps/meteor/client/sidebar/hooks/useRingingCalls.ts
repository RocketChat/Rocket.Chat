import {
	useVideoConfAcceptCall,
	useVideoConfIncomingCalls,
	useVideoConfRejectIncomingCall,
	useVideoConfWindowEnabled,
} from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

export type RingingCallActions = {
	acceptCall: () => void;
	rejectCall: () => void;
};

/** The rooms whose ringing call the room list is the place to answer, by room id. Empty when it is not. */
export const useRingingCalls = (): ReadonlyMap<string, RingingCallActions> => {
	const acceptCall = useVideoConfAcceptCall();
	const rejectCall = useVideoConfRejectIncomingCall();
	const incomingCalls = useVideoConfIncomingCalls();
	const conferenceWindowEnabled = useVideoConfWindowEnabled();

	// With the call window, a ringing call is answered from the list of the calls already running rather than
	// from the row for its room — so no row is offered the call.
	return useMemo(() => {
		if (conferenceWindowEnabled) {
			return new Map();
		}

		return new Map(
			incomingCalls.map((call) => [call.rid, { acceptCall: () => acceptCall(call.callId), rejectCall: () => rejectCall(call.callId) }]),
		);
	}, [incomingCalls, conferenceWindowEnabled, acceptCall, rejectCall]);
};
