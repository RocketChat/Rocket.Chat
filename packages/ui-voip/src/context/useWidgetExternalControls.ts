import { useCallback } from 'react';

import { useMediaCallInstance } from './MediaCallInstanceContext';
import type { PeerInfo } from './definitions';
import { getEndCall } from '../utils/instanceControlsGetters';

export const useWidgetExternalControls = () => {
	const { signalEmitter, instance } = useMediaCallInstance();

	const toggleWidget = useCallback(
		(peerInfo?: PeerInfo) => {
			signalEmitter.emit('toggleWidget', { peerInfo });
		},
		[signalEmitter],
	);

	const showWidget = useCallback(
		(peerInfo?: PeerInfo) => {
			signalEmitter.emit('showWidget', { peerInfo });
		},
		[signalEmitter],
	);

	const hideWidget = useCallback(() => {
		signalEmitter.emit('hideWidget');
	}, [signalEmitter]);

	const endCall = useCallback(() => getEndCall(instance)(), [instance]);

	return { toggleWidget, showWidget, hideWidget, endCall };
};
