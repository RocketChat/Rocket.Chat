import { useEffect, useState } from 'react';

import { useMediaCallInstanceContext } from './MediaCallInstanceContext';
import type { PeerInfo } from './definitions';
import { derivePeerInfoFromInstanceContact } from '../utils/derivePeerInfoFromInstanceContact';

export const usePeekMediaSessionPeerInfo = (): PeerInfo | undefined => {
	const { instance } = useMediaCallInstanceContext();
	const [peerInfo, setPeerInfo] = useState<PeerInfo | undefined>(undefined);

	useEffect(() => {
		if (!instance) {
			setPeerInfo(undefined);
			return;
		}
		const updatePeerInfo = () => {
			const mainCall = instance.getMainCall();
			if (!mainCall) {
				return;
			}
			const { contact } = mainCall;
			setPeerInfo(derivePeerInfoFromInstanceContact(contact));
		};
		updatePeerInfo();
		return instance.on('sessionStateChange', updatePeerInfo);
	}, [instance]);

	return peerInfo;
};
