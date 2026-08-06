import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { VIDEO_CONF_RINGING_WINDOW_MS, isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVideoConfDismissCall } from '@rocket.chat/ui-video-conf';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { videoConferenceQueryKeys } from '../../lib/queryKeys';
import { useJoinCall } from '../../views/conference/hooks/useJoinCall';
import { useJoinableCalls } from '../../views/conference/hooks/useJoinableCalls';

/**
 * The calls worth offering the user, and what to do with them.
 *
 * Ringing first, and separately: a call ringing now is being asked of the user, while the rest are simply there
 * to be joined. Everything else is one list, freshest first.
 *
 * Read by both places that show these calls — the panel docked in the sidebar and the one behind the navbar
 * button — so they can't disagree about what is ringing or how many there are.
 */
export const useOngoingCalls = () => {
	const { calls } = useJoinableCalls();
	const joinCall = useJoinCall();
	const declineCall = useEndpoint('POST', '/v1/video-conference.decline');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const { mutate: decline } = useMutation({
		mutationFn: (callId: string) => declineCall({ callId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	// A ring stops being a ring on its own, with nothing to announce it — so wake up when the earliest one's
	// window is over and let the list settle back into an ordinary call.
	const [, setElapsed] = useState(0);

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

	useEffect(() => {
		const nextToStop = ringing.reduce<number | undefined>((earliest, { ringingAt }) => {
			const stopsAt = (ringingAt as Date).getTime() + VIDEO_CONF_RINGING_WINDOW_MS;
			return earliest === undefined || stopsAt < earliest ? stopsAt : earliest;
		}, undefined);

		if (nextToStop === undefined) {
			return;
		}

		const timer = setTimeout(() => setElapsed((tick) => tick + 1), Math.max(nextToStop - Date.now(), 0) + 100);

		return () => clearTimeout(timer);
	}, [ringing]);

	return { ringing, ongoing, joinCall, decline, silence, silencedCalls };
};
