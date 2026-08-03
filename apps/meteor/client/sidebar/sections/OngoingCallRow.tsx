import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

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
				<Box fontScale='micro' color='hint'>
					{t('__count__people_in_the_call', { count: call.usersCount })}
				</Box>
			</Box>
			{/* Every row is something to act on — the section leaves out the call the reader is already in, so
			    there is no state here that offers nothing to do. */}
			<ButtonGroup>
				<Button small onClick={() => onDecline(call.callId)}>
					{t('Decline')}
				</Button>
				<Button small primary onClick={() => onJoin(call.callId)}>
					{t('Join')}
				</Button>
			</ButtonGroup>
		</Box>
	);
};

export default OngoingCallRow;
