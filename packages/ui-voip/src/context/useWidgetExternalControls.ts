import { useCallback } from 'react';

import { useMediaCallInstance } from './MediaCallInstanceContext';
import type { PeerInfo } from './definitions';
import { getEndCall } from '../utils/instanceControlsGetters';

export const useWidgetExternalControls = () => {
	const { instance, openWidget, closeWidget, targetWidgetVisibility } = useMediaCallInstance();

	const toggleWidget = useCallback(
		(peerInfo?: PeerInfo) => {
			if (targetWidgetVisibility === 'closed') {
				openWidget(peerInfo);
				return;
			}
			closeWidget();
		},
		[closeWidget, openWidget, targetWidgetVisibility],
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
