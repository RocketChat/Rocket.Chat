import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import OngoingCallRow from './OngoingCallRow';
import SidebarCard from './SidebarCard';
import { videoConferenceQueryKeys } from '../../lib/queryKeys';
import { useJoinCall } from '../../views/conference/hooks/useJoinCall';
import { useJoinableCalls } from '../../views/conference/hooks/useJoinableCalls';

/**
 * Calls the reader may join right now, whether or not they were ever rung — ringing is one-shot and rings
 * nobody at all in a room over ten subscribers, so this is the only route to some of these calls.
 */
const OngoingCallsSection = () => {
	const { t } = useTranslation();
	const { calls } = useJoinableCalls();
	// One per section rather than one per row: every instance would otherwise read the same list back.
	const joinCall = useJoinCall();
	const declineCall = useEndpoint('POST', '/v1/video-conference.decline');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const { mutate: decline } = useMutation({
		mutationFn: (callId: string) => declineCall({ callId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	// Declining is a settled decision here: it quiets the sidebar. The call history is the way back to it.
	const joinableCalls = calls.filter((call) => !call.declined);

	if (joinableCalls.length === 0) {
		return null;
	}

	return (
		<SidebarCard>
			<Box fontScale='c1' color='hint' marginBlockEnd={8}>
				{t('Ongoing_calls')}
			</Box>
			{joinableCalls.map((call) => (
				<OngoingCallRow key={call.callId} call={call} onJoin={joinCall} onDecline={decline} />
			))}
		</SidebarCard>
	);
};

export default OngoingCallsSection;
