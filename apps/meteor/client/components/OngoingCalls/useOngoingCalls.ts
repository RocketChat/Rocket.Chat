import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVideoConfDismissCall } from '@rocket.chat/ui-video-conf';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { useRingingExpiry } from '../../hooks/useRingingExpiry';
import { videoConferenceQueryKeys } from '../../lib/queryKeys';
import { useJoinCall } from '../../views/conference/hooks/useJoinCall';
import { useJoinableCalls } from '../../views/conference/hooks/useJoinableCalls';

/**
 * The calls worth offering the user, split into the ones asking something of them and the ones simply running.
 *
 * A call ringing now is being asked of the user; the rest are there to be joined. Both lists are freshest first.
 *
 * Separate from the actions below because the two containers — the sidebar's card and the navbar's dropdown —
 * only need to know whether there is anything to make room for, and how much is ringing. Wiring up a decline and
 * a silence list to answer that gave each of them a second, unused copy of both.
 */
export const useOngoingCallsList = () => {
	const { calls } = useJoinableCalls();

	// Declining quiets this list — that is what it is for here; the call history is the way back to it. A call the
	// reader is already in is not something to reach, either.
	const actionable = useMemo(() => calls.filter((call) => !call.declined && !call.joined), [calls]);

	const { ringing, ongoing } = useMemo(() => {
		const isRinging = (call: JoinableVideoConference) => isRingingVideoConferenceMember({ ringingAt: call.ringingAt });

		return {
			ringing: actionable.filter(isRinging),
			ongoing: actionable.filter((call) => !isRinging(call)),
		};
	}, [actionable]);

	// So a call whose ring lapses settles into an ordinary one without waiting for something else to move.
	useRingingExpiry(ringing.map(({ ringingAt }) => ringingAt));

	return { ringing, ongoing };
};

/**
 * The calls, and what can be done with each of them. For whoever actually renders the list.
 */
export const useOngoingCalls = () => {
	const { ringing, ongoing } = useOngoingCallsList();
	const joinCall = useJoinCall();
	const declineCall = useEndpoint('POST', '/v1/video-conference.decline');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const { mutate: decline } = useMutation({
		mutationFn: (callId: string) => declineCall({ callId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	/**
	 * Silencing is not answering: the ring stops so the user can decide in their own time, and the call stays.
	 *
	 * Remembered here because the manager forgets a dismissed call entirely — and without remembering, a silenced
	 * call would be indistinguishable from one whose ring this client never heard.
	 */
	const dismissCall = useVideoConfDismissCall();
	const [silencedCalls, setSilencedCalls] = useState<string[]>([]);

	const silence = useCallback(
		(callId: string) => {
			dismissCall(callId);
			setSilencedCalls((silenced) => (silenced.includes(callId) ? silenced : [...silenced, callId]));
		},
		[dismissCall],
	);

	return { ringing, ongoing, joinCall, decline, silence, silencedCalls };
};
