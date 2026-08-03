import { OngoingCall, NewCall, IncomingCall, OutgoingCall, IncomingCallTransfer, OutgoingCallTransfer } from '..';
import OngoingCallWithScreen from './OngoingCallWithScreen';
import { useMediaCallView } from '../../context/MediaCallViewContext';

const MediaCallWidgetViewRouter = () => {
	const {
		sessionState: { state, transferredBy, supportedFeatures },
	} = useMediaCallView();

	switch (state) {
		case 'ongoing':
			if (supportedFeatures.includes('screen-share')) {
				return <OngoingCallWithScreen />;
			}
			return <OngoingCall />;
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
		case 'none':
		default:
			return <NewCall />;
	}
};

export default MediaCallWidgetViewRouter;
