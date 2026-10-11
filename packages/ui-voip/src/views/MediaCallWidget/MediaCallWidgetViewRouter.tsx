import { OngoingCall, NewCall, IncomingCall, OutgoingCall } from '..';
import OngoingCallWithScreen from './OngoingCallWithScreen';
import { useMediaCallView } from '../../context/MediaCallViewContext';

const MediaCallWidgetViewRouter = () => {
	const {
		sessionState: { state, supportedFeatures },
	} = useMediaCallView();

	switch (state) {
		case 'ongoing':
			if (supportedFeatures.includes('screen-share')) {
				return <OngoingCallWithScreen />;
			}
			return <OngoingCall />;
		case 'ringing':
			return <IncomingCall />;
		case 'calling':
			return <OutgoingCall />;
		case 'none':
		default:
			return <NewCall />;
	}
};

export default MediaCallWidgetViewRouter;
