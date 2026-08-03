import { Box, Button } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import OngoingCallRow from './OngoingCallRow';
import SidebarCard from './SidebarCard';
import { videoConferenceQueryKeys } from '../../lib/queryKeys';
import { useJoinCall } from '../../views/conference/hooks/useJoinCall';
import { useJoinableCalls } from '../../views/conference/hooks/useJoinableCalls';

/** How many to show before asking. The sidebar is a route to a call, not a place to read a list. */
const COLLAPSED_LIMIT = 3;

/**
 * Calls the reader may join right now, whether or not they were ever rung — ringing is one-shot and rings
 * nobody at all in a room over ten subscribers, so this is the only route to some of these calls.
 *
 * Every row here is something to act on: join it, or turn it down so it stops asking. The call the reader is
 * *already in* is therefore not listed — they are in it, there is nothing to reach, and a row that only said "in
 * call" left the reader with something they couldn't do anything about.
 */
const OngoingCallsSection = () => {
	const { t } = useTranslation();
	const { calls } = useJoinableCalls();
	// One per section rather than one per row: every instance would otherwise read the same list back.
	const joinCall = useJoinCall();
	const declineCall = useEndpoint('POST', '/v1/video-conference.decline');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const [expanded, setExpanded] = useState(false);

	const { mutate: decline } = useMutation({
		mutationFn: (callId: string) => declineCall({ callId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	// Declining quiets the sidebar — that is what it is for here; the call history is the way back to it. And a
	// call the reader is in is not something to reach.
	const actionable = calls.filter((call) => !call.declined && !call.joined);

	if (actionable.length === 0) {
		return null;
	}

	const hidden = actionable.length - COLLAPSED_LIMIT;
	const shown = expanded ? actionable : actionable.slice(0, COLLAPSED_LIMIT);

	return (
		<SidebarCard>
			<Box fontScale='c1' color='hint' marginBlockEnd={8}>
				{t('Ongoing_calls')}
			</Box>
			{shown.map((call) => (
				<OngoingCallRow key={call.callId} call={call} onJoin={joinCall} onDecline={decline} />
			))}
			{hidden > 0 && (
				<Button small secondary width='100%' onClick={() => setExpanded(!expanded)}>
					{expanded ? t('Show_fewer') : t('Show_all')}
				</Button>
			)}
		</SidebarCard>
	);
};

export default OngoingCallsSection;
