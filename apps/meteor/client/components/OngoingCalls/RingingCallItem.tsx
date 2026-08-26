import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

import CallListItem from './CallListItem';

type RingingCallItemProps = {
	call: JoinableVideoConference;
	silenced: boolean;
	onAccept: (callId: string) => void;
	onReject: (callId: string) => void;
	onSilence: (callId: string) => void;
};

const RingingCallItem = ({ call, silenced, onAccept, onReject, onSilence }: RingingCallItemProps) => {
	const { t } = useTranslation();

	const incomingCalls = useVideoConfIncomingCalls();
	const heardHere = incomingCalls.some(({ callId, dismissed }) => callId === call.callId && !dismissed);
	const audible = heardHere && !silenced;

	return (
		<CallListItem
			call={call}
			onOpen={() => onAccept(call.callId)}
			timeLabel={
				<Box is='span' color='info'>
					{t('Ringing')}…
				</Box>
			}
			actions={
				<>
					{silenced && <Icon name='bell-off' size='x16' color='hint' title={t('Incoming_call_silenced')} />}
					{audible && (
						<IconButton
							mini
							secondary
							icon='bell-off'
							title={t('Silence')}
							aria-label={t('Silence')}
							onClick={() => onSilence(call.callId)}
						/>
					)}
					<IconButton mini secondary icon='cross' title={t('Decline')} aria-label={t('Decline')} onClick={() => onReject(call.callId)} />
				</>
			}
		/>
	);
};

export default RingingCallItem;
