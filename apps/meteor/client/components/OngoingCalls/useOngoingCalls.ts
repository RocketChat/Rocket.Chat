import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVideoConfDismissCall } from '@rocket.chat/ui-video-conf';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useRingingExpiry } from '../../hooks/useRingingExpiry';
import { videoConferenceQueryKeys } from '../../lib/queryKeys';
import { useJoinCall } from '../../views/conference/hooks/useJoinCall';
import { useJoinableCalls } from '../../views/conference/hooks/useJoinableCalls';

export const useOngoingCallsList = () => {
	const { calls } = useJoinableCalls();

	// Not memoized: `isRingingVideoConferenceMember` is time-dependent (uses Date.now()), and the re-render
	// triggered by `useRingingExpiry` must see a fresh evaluation to move a call from ringing to ongoing.
	const isRinging = (call: JoinableVideoConference) => isRingingVideoConferenceMember({ ringingAt: call.ringingAt });
	const asked = calls.filter((call) => call.joined || !call.declined);

	const ringing = asked.filter((call) => !call.joined && isRinging(call));
	const ongoing = asked.filter((call) => call.joined || !isRinging(call));
	const declined = calls.filter((call) => !call.joined && call.declined);

	useRingingExpiry(ringing.map(({ ringingAt }) => ringingAt));

	return { ringing, ongoing, declined };
};

export const useOngoingCalls = () => {
	const { ringing, ongoing, declined } = useOngoingCallsList();
	const joinCall = useJoinCall();
	const declineCall = useEndpoint('POST', '/v1/video-conference.decline');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const { mutate: decline } = useMutation({
		mutationFn: (callId: string) => declineCall({ callId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const dismissCall = useVideoConfDismissCall();
	const [silencedCalls, setSilencedCalls] = useState<string[]>([]);

	const silence = useCallback(
		(callId: string) => {
			dismissCall(callId);
			setSilencedCalls((silenced) => (silenced.includes(callId) ? silenced : [...silenced, callId]));
		},
		[dismissCall],
	);

	const [showAll, setShowAll] = useState(false);
	const toggleShowAll = useCallback(() => setShowAll((v) => !v), []);

	return { ringing, ongoing, declined, joinCall, decline, silence, silencedCalls, showAll, toggleShowAll };
};

export const canDeclineCall = (call: JoinableVideoConference): boolean => !call.declined && !call.joined;
