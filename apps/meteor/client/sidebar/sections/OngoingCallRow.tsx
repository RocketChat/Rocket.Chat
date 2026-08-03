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
			{/* Already in this call — offering to join it again would be a no-op, and there is nothing left to
			    decline once joined, so the row marks presence instead of repeating both actions. */}
			{call.joined ? (
				<Box fontScale='c1' color='hint'>
					{t('In_call')}
				</Box>
			) : (
				<ButtonGroup>
					<Button small onClick={() => onDecline(call.callId)}>
						{t('Decline')}
					</Button>
					<Button small primary onClick={() => onJoin(call.callId)}>
						{t('Join')}
					</Button>
				</ButtonGroup>
			)}
		</Box>
	);
};

export default OngoingCallRow;
