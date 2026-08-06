import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Icon, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CallParticipants from './CallParticipants';

type OngoingCallRowProps = {
	call: JoinableVideoConference;
	onJoin: (callId: string) => void;
	onDecline: (callId: string) => void;
};

const OngoingCallRow = ({ call, onJoin, onDecline }: OngoingCallRowProps) => {
	const { t } = useTranslation();

	return (
		<Box display='flex' alignItems='center' marginBlockEnd={8} style={{ gap: 8 }}>
			<Icon name='video' size='x20' />
			<Box minWidth={0} flexGrow={1}>
				<Box fontScale='p2b' color='default' withTruncatedText>
					{call.name}
				</Box>
				<CallParticipants participants={call.participants} usersCount={call.usersCount} />
			</Box>
			{/* Every row is something to act on — the section leaves out the call the reader is already in, so
			    there is no state here that offers nothing to do. Joining is the offer; turning the call down is the
			    way to be rid of the row, which is a smaller thing and reads as one. */}
			<ButtonGroup>
				<Button small primary onClick={() => onJoin(call.callId)}>
					{t('Join')}
				</Button>
				<IconButton tiny icon='cross' title={t('Decline')} aria-label={t('Decline')} onClick={() => onDecline(call.callId)} />
			</ButtonGroup>
		</Box>
	);
};

export default OngoingCallRow;
