import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useCallback, useEffect, useState } from 'react';

import type { PeerInfo } from '../context';

export const useInstanceState = (instance?: MediaSignalingSession) => {
	const [openRoomId, setOpenRoomId] = useState<string | undefined>(undefined);
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

	// If a call ended the widget should close.
	useEffect(() => {
		return instance?.on('endedCall', () => {
			setTargetWidgetVisibility('closed');
			setTargetPeer(undefined);
		});
	}, [instance]);

	return { openWidget, closeWidget, targetPeer, setTargetPeer, targetWidgetVisibility, openRoomId, setOpenRoomId };
};
