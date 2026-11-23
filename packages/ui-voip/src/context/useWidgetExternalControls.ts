import { useCallback } from 'react';

import { useMediaCallInstance } from './MediaCallInstanceContext.js';
import type { PeerInfo } from './definitions.js';
import { getEndCall } from '../utils/instanceControlsGetters.js';

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

	return { toggleWidget, endCall, openWidget };
};
