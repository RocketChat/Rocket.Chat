import type { OngoingCallsContextValue } from '@rocket.chat/ui-conference';
import { OngoingCallsContext, useRinging } from '@rocket.chat/ui-conference';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVideoConfDismissCall, useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { useShortTimeAgo } from '../../../hooks/useTimeAgo';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';
import { useJoinOrSwitchCallModal } from '../hooks/useJoinOrSwitchCallModal';
import { useJoinableCalls } from '../hooks/useJoinableCalls';

/**
 * The calls this user could walk into, and what the list of them can do.
 *
 * Bucketing happens here rather than in each row because "still ringing" is an answer with a clock in it: asked
 * once, the groups below are plain facts about a list and change when the answer does.
 */
export const useOngoingCallsList = () => {
	const { calls } = useJoinableCalls();

	const asked = calls.filter((call) => call.joined || !call.declined);

	const stillRinging = new Set(useRinging(asked));

	const ringing = asked.filter((call) => !call.joined && stillRinging.has(call));
	const ongoing = asked.filter((call) => call.joined || !stillRinging.has(call));
	const declined = calls.filter((call) => !call.joined && call.declined);

	// `calls` comes back whole as well as sorted: switching calls needs the one this user is already in, and a
	// second hook fetching the same list for it also subscribed a second time to the same stream.
	return { calls, ringing, ongoing, declined };
};

const OngoingCallsProvider = ({ children }: { children: ReactNode }) => {
	const { calls, ringing, ongoing, declined } = useOngoingCallsList();
	const joinCall = useJoinOrSwitchCallModal(calls);
	const declineEndpoint = useEndpoint('POST', '/v1/video-conference.decline');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const formatTime = useShortTimeAgo();

	const { mutate: declineCall } = useMutation({
		mutationFn: (callId: string) => declineEndpoint({ callId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const dismissCall = useVideoConfDismissCall();
	const [silencedCalls, setSilencedCalls] = useState<string[]>([]);

	const silenceCall = useCallback(
		(callId: string) => {
			dismissCall(callId);
			setSilencedCalls((silenced) => (silenced.includes(callId) ? silenced : [...silenced, callId]));
		},
		[dismissCall],
	);

	// Whether a ring is audible is this client's own answer, not the call's: the same call can be sounding here
	// and already answered on another of this user's sessions. Both lists live here, so a row is told about its
	// own call rather than handed them to search.
	const incomingCalls = useVideoConfIncomingCalls();

	const callRing = useCallback(
		(callId: string) => ({
			audible: incomingCalls.some((incoming) => incoming.callId === callId && !incoming.dismissed),
			silenced: silencedCalls.includes(callId),
			silence: () => silenceCall(callId),
		}),
		[incomingCalls, silencedCalls, silenceCall],
	);

	const value = useMemo(
		(): OngoingCallsContextValue => ({
			ringing,
			ongoing,
			declined,
			joinCall,
			declineCall,
			callRing,
			callHref: (callId) => `/conference/${callId}`,
			formatTime,
		}),
		[callRing, declineCall, declined, formatTime, joinCall, ongoing, ringing],
	);

	return <OngoingCallsContext.Provider value={value}>{children}</OngoingCallsContext.Provider>;
};

export default OngoingCallsProvider;
