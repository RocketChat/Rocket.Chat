import { useCallback } from 'react';

import { useMediaCallInstance } from './MediaCallInstanceContext';
import type { PeerInfo } from './definitions';
import { getEndCall } from '../utils/instanceControlsGetters';

export const useWidgetExternalControls = () => {
	const { instance, openWidget, closeWidget, widgetVisibility } = useMediaCallInstance();

	const toggleWidget = useCallback(
		(peerInfo?: PeerInfo) => {
			if (widgetVisibility === 'closed') {
				openWidget(peerInfo);
				return;
			}
			closeWidget();
		},
		[closeWidget, openWidget, widgetVisibility],
	);

	const endCall = useCallback(() => getEndCall(instance)(), [instance]);

	return { toggleWidget, endCall };
};
