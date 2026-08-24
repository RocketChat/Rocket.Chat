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

	const endCall = useCallback(() => getEndCall(instance)(), [instance]);

	return { toggleWidget, endCall };
};
