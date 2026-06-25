import { useKeypad } from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import { useMediaCallWidgetSlot } from '../../context/MediaCallWidgetSlotContext';

/**
 * Inline DTMF dialpad for the sidebar-rail call panel (DMV-16).
 *
 * Rendered inside the widget content rather than the footer action row, so it
 * stays clear of footer-level features (e.g. AppActions) and can be added
 * without editing shared footer markup — keeping this change isolated.
 *
 * Visible only when the widget is inline (sidebar rail), the call is external
 * (SIP), and screen sharing is not active. Internal user-to-user calls don't
 * need DTMF, and an active screen share must keep the available space.
 */
const MediaCallDialpad = () => {
	const { sessionState, streams, onTone } = useMediaCallView();
	const { peerInfo } = sessionState;
	const { inline } = useMediaCallWidgetSlot();

	// The keypad is permanently expanded inline, so it must not steal focus on mount.
	const { element } = useKeypad(onTone, { alwaysOpen: true });

	const isSip = !!peerInfo && 'number' in peerInfo;
	const isScreenSharing = Boolean(streams?.localScreen?.active);

	if (!inline || !isSip || isScreenSharing) {
		return null;
	}

	return <>{element}</>;
};

export default MediaCallDialpad;
