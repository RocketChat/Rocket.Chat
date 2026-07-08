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

	const openDialer = useCallback(
		(peerInfo?: PeerInfo) => {
			signalEmitter.emit('openDialer', { peerInfo });
		},
		[signalEmitter],
	);

	const closeDialer = useCallback(() => {
		signalEmitter.emit('closeDialer', undefined);
	}, [signalEmitter]);

	const endCall = useCallback(() => getEndCall(instance)(), [instance]);

	return { toggleWidget, openDialer, closeDialer, endCall };
};
