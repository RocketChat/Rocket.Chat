import { useCallback } from 'react';

import { useMediaCallInstanceContext } from './MediaCallInstanceContext';
import type { PeerInfo } from './definitions';
import { getEndCall } from './useMediaSessionControls';

export const useWidgetExternalControls = () => {
	const { signalEmitter, instance } = useMediaCallInstanceContext();

	const toggleWidget = useCallback(
		(peerInfo?: PeerInfo) => {
			signalEmitter.emit('toggleWidget', { peerInfo });
		},
		[signalEmitter],
	);

	const endCall = useCallback(() => getEndCall(instance)(), [instance]);

	return { toggleWidget, endCall };
};
