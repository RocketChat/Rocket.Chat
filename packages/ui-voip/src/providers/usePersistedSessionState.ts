import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import type { PeerInfo } from '../context';
import type { MediaSessionStateSubscription } from './useMediaSessionStateSubscription';

export const usePersistedSessionState = (sessionStateSubscription: MediaSessionStateSubscription, instance?: MediaSignalingSession) => {
	const [targetWidgetVisibility, setTargetWidgetVisibility] = useState<'open' | 'closed'>('closed');
	const [targetPeer, setTargetPeer] = useState<PeerInfo | undefined>(undefined);

	const openWidget = useCallback((peerInfo?: PeerInfo) => {
		setTargetWidgetVisibility('open');
		setTargetPeer((oldPeerInfo) => {
			if (!peerInfo) {
				return oldPeerInfo;
			}
			return peerInfo;
		});
	}, []);

	const closeWidget = useCallback(() => {
		setTargetWidgetVisibility('closed');
	}, []);

	const { subscribe: subscribeToState, getSnapshot: getStateSnapshot } = sessionStateSubscription;

	const getWidgetVisibility = useCallback(() => {
		const { state } = getStateSnapshot();
		if (['calling', 'ringing', 'ongoing'].includes(state)) {
			return 'open';
		}
		return targetWidgetVisibility;
	}, [getStateSnapshot, targetWidgetVisibility]);

	const widgetVisibility = useSyncExternalStore(subscribeToState, getWidgetVisibility);

	// If a call ended the widget should close.
	useEffect(() => {
		return instance?.on('endedCall', () => {
			setTargetWidgetVisibility('closed');
			setTargetPeer(undefined);
		});
	}, [instance]);

	return { openWidget, closeWidget, targetPeer, setTargetPeer, widgetVisibility };
};
