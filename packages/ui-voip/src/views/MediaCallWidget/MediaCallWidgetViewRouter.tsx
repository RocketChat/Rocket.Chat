import IncomingCall from './IncomingCall';
import NewCall from './NewCall';
import OngoingCall from './OngoingCall';
import OngoingCallWithScreen from './OngoingCallWithScreen';
import OutgoingCall from './OutgoingCall';
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
