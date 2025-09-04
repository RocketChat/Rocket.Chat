import { useMediaCallContext } from './MediaCallContext';
import { OngoingCall, NewCall, IncomingCall, OutgoingCall } from './views';

const MediaCallWidget = () => {
	const { state } = useMediaCallContext();

	switch (state) {
		case 'ongoing':
			return <OngoingCall />;
		case 'new':
			return <NewCall />;
		case 'ringing':
			return <IncomingCall />;
		case 'calling':
			return <OutgoingCall />;
		case 'closed':
		default:
			return null;
	}
};

export default MediaCallWidget;
