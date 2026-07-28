import { OngoingCall, NewCall, IncomingCall, OutgoingCall, IncomingCallTransfer, OutgoingCallTransfer } from '..';
import OngoingCallWithScreen from './OngoingCallWithScreen';
import { useMediaCallView } from '../../context/MediaCallViewContext';

const MediaCallWidgetViewRouter = () => {
	const {
		sessionState: { state, transferredBy, peerInfo, supportedFeatures },
	} = useMediaCallView();

	switch (state) {
		case 'ongoing':
			if ('username' in peerInfo && supportedFeatures.includes('screen-share')) {
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

export default MediaCallWidgetViewRouter;
