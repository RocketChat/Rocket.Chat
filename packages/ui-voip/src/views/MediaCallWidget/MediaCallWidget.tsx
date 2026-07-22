import { OngoingCall, NewCall, IncomingCall, OutgoingCall, IncomingCallTransfer, OutgoingCallTransfer } from '..';
import OngoingCallWithScreen from './OngoingCallWithScreen';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import { useMediaCallWidgetSlot } from '../../context/MediaCallWidgetSlotContext';
import useRegisterView from '../../context/useRegisterView';

const MediaCallWidget = () => {
	const currentViews = useRegisterView('widget');
	const { inline } = useMediaCallWidgetSlot();
	const {
		sessionState: { state, hidden, transferredBy, peerInfo, supportedFeatures, docked },
	} = useMediaCallView();

	if (hidden || !currentViews.includes('widget')) {
		return null;
	}

	switch (state) {
		case 'ongoing':
			if ('username' in peerInfo && supportedFeatures.includes('screen-share')) {
				return <OngoingCallWithScreen />;
			}
			return <OngoingCall />;
		case 'new':
			// A docked dialer belongs to the sidebar call panel slot. When that slot is gone
			// (navigated off the panel) it must not pop out as a floating widget.
			if (docked && !inline) {
				return null;
			}
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
			if (inline) {
				return <NewCall />;
			}
			return null;
	}
};

export default MediaCallWidget;
