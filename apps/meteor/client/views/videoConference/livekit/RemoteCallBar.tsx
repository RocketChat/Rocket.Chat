import { Box } from '@rocket.chat/fuselage';
import { useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import { CallBar } from '@rocket.chat/ui-voip';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useLiveKitVideoConf } from './LiveKitVideoConfContext';
import { getRemoteCallState, sendCallCommand, subscribeRemoteCallState } from './callBarChannel';

/**
 * Main-window side of the in-app call bar: renders the persistent bottom
 * CallBar while a call runs in the pop-out conference window. Per the spec
 * there is NO simplified video feed inside the app — this bar is the single
 * in-app representation of the active call.
 */
const RemoteCallBar = () => {
	const { t } = useTranslation();
	const state = useSyncExternalStore(subscribeRemoteCallState, getRemoteCallState);
	const { activeCall } = useLiveKitVideoConf();
	const routePath = useCurrentRoutePath();
	const isConferenceRoute = routePath?.startsWith('/conference/') ?? false;

	// no remote call, or this window owns a call itself (in-app group call /
	// the conference window) → no bar
	if (!state || activeCall || isConferenceRoute) {
		return null;
	}

	const { callId } = state;
	const statusText = state.sharing ? t('Sharing_your_screen') : t('Call_in_room', { room: state.roomName });

	return createPortal(
		<Box position='fixed' insetInline={0} insetBlockEnd={0} zIndex={100}>
			<CallBar
				statusText={statusText}
				muted={state.muted}
				camOn={state.camOn}
				sharing={state.sharing}
				handRaised={state.handRaised}
				onToggleMic={() => sendCallCommand(callId, 'toggleMic')}
				onToggleCam={() => sendCallCommand(callId, 'toggleCam')}
				onToggleShare={() => sendCallCommand(callId, 'toggleShare')}
				onToggleHand={() => sendCallCommand(callId, 'toggleHand')}
				onHangup={() => sendCallCommand(callId, 'hangup')}
				onReturnToCall={() => sendCallCommand(callId, 'focus')}
			/>
		</Box>,
		document.body,
	);
};

export default RemoteCallBar;
