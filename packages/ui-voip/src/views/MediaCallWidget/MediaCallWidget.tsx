import { OngoingCall, NewCall, IncomingCall, OutgoingCall, IncomingCallTransfer, OutgoingCallTransfer } from '..';
import OngoingCallWithScreen from './OngoingCallWithScreen';
import { useMediaCallInstance } from '../../context/MediaCallInstanceContext';
import { useMediaCallView } from '../../context/MediaCallViewContext';

const MediaCallWidget = () => {
	const { inRoomView } = useMediaCallInstance();
	const {
		sessionState: { state, hidden, transferredBy, peerInfo },
		screenShareEnabled,
	} = useMediaCallView();

	if (hidden || inRoomView) {
		return null;
	}

	switch (state) {
		case 'ongoing':
			if ('username' in peerInfo && screenShareEnabled) {
				return <OngoingCallWithScreen />;
			}
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
