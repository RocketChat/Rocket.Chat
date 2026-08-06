import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import CallParticipants from './CallParticipants';

type CallSummaryProps = {
	call: JoinableVideoConference;
	/** Ringing calls say so in red; the rest are just calls. */
	ringing?: boolean;
	/** Anything that belongs on the same line as the name, at the inline end. */
	children?: ReactNode;
};

/**
 * What a call in the list says about itself: that it is a conference, what it is called, and who is in it.
 *
 * Shared by the ringing item and the ordinary row, because that much is the same for both — what differs is what
 * they offer, and a ringing call gets its actions on a line of their own.
 */
const CallSummary = ({ call, ringing, children }: CallSummaryProps) => (
	<Box display='flex' alignItems='center' style={{ gap: 8 }}>
		<Icon name='video' size='x20' color={ringing ? 'status-font-on-danger' : undefined} />
		<Box minWidth={0} flexGrow={1}>
			<Box fontScale='p2b' color='default' withTruncatedText>
				{call.name}
			</Box>
			<CallParticipants participants={call.participants} usersCount={call.usersCount} />
		</Box>
		{children}
	</Box>
);

export default CallSummary;
