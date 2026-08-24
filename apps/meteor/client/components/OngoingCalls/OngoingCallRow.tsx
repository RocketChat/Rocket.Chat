import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CallListItem from './CallListItem';

type OngoingCallRowProps = {
	call: JoinableVideoConference;
	onJoin: (callId: string) => void;
	onDecline?: (callId: string) => void;
};

const callActions = (call: JoinableVideoConference, onDecline: ((callId: string) => void) | undefined, t: (key: string) => string) => {
	if (onDecline) {
		return <IconButton mini secondary icon='cross' title={t('Decline')} aria-label={t('Decline')} onClick={() => onDecline(call.callId)} />;
	}

	if (call.declined) {
		return (
			<Box fontScale='micro' color='hint'>
				({t('Declined_call')})
			</Box>
		);
	}

	return undefined;
};

const OngoingCallRow = ({ call, onJoin, onDecline }: OngoingCallRowProps) => {
	const { t } = useTranslation();

	return <CallListItem call={call} onOpen={() => onJoin(call.callId)} actions={callActions(call, onDecline, t)} />;
};

export default OngoingCallRow;
