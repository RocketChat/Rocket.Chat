import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVideoConfDismissCall } from '@rocket.chat/ui-video-conf';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useRinging } from '../../hooks/useRinging';
import { videoConferenceQueryKeys } from '../../lib/queryKeys';
import { useJoinOrSwitchCallModal } from '../../views/conference/hooks/useJoinOrSwitchCallModal';
import { useJoinableCalls } from '../../views/conference/hooks/useJoinableCalls';

export const useOngoingCallsList = () => {
	const { calls } = useJoinableCalls();

	const asked = calls.filter((call) => call.joined || !call.declined);

	// Which of them are ringing is an answer with a clock in it, so it is asked for rather than worked out here:
	// the groups below are then plain facts about a list, and change when the answer does.
	const stillRinging = new Set(useRinging(asked));

	const ringing = asked.filter((call) => !call.joined && stillRinging.has(call));
	const ongoing = asked.filter((call) => call.joined || !stillRinging.has(call));
	const declined = calls.filter((call) => !call.joined && call.declined);

	// `calls` comes back whole as well as sorted: switching calls needs the one this user is already in, and a
	// second hook fetching the same list for it also subscribed a second time to the same stream.
	return { calls, ringing, ongoing, declined };
};

export const useOngoingCalls = () => {
	const { calls, ringing, ongoing, declined } = useOngoingCallsList();
	const joinCall = useJoinOrSwitchCallModal(calls);
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
