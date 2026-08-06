import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CallSummary from './CallSummary';

type OngoingCallRowProps = {
	call: JoinableVideoConference;
	onJoin: (callId: string) => void;
	onDecline: (callId: string) => void;
};

const OngoingCallRow = ({ call, onJoin, onDecline }: OngoingCallRowProps) => {
	const { t } = useTranslation();

	return (
		<Box marginBlockEnd={8}>
			<CallSummary call={call}>
				{/* Every row is something to act on — the section leaves out the call the reader is already in, so
				    there is no state here that offers nothing to do. Joining is the offer; turning the call down is the
				    way to be rid of the row, which is a smaller thing and reads as one. */}
				<ButtonGroup>
					<Button small primary onClick={() => onJoin(call.callId)}>
						{t('Join')}
					</Button>
					<IconButton tiny icon='cross' title={t('Decline')} aria-label={t('Decline')} onClick={() => onDecline(call.callId)} />
				</ButtonGroup>
			</CallSummary>
		</Box>
	);
};

export default OngoingCallRow;
