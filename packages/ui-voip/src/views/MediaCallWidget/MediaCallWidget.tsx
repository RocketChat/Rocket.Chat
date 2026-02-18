import { OngoingCall, NewCall, IncomingCall, OutgoingCall, IncomingCallTransfer, OutgoingCallTransfer } from '..';
import { useMediaCallContext } from '../../context';

const MediaCallWidget = () => {
	const { sessionState } = useMediaCallContext();
	const { state, hidden, transferredBy } = sessionState;

	if (hidden) {
		return null;
	}

	switch (state) {
		case 'ongoing':
			return <OngoingCall />;
		case 'new':
			return <NewCall />;
		case 'ringing':
			if (transferredBy) {
				return <IncomingCallTransfer />;
			}
			return <IncomingCall />;
		case 'calling':
			if (transferredBy) {
				return <OutgoingCallTransfer />;
			}
			return <OutgoingCall />;
		case 'closed':
		default:
			return null;
	}
};

export default MediaCallWidget;
