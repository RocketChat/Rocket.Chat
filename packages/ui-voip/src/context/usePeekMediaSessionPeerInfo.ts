import { useCallback, useSyncExternalStore } from 'react';

import { useMediaCallInstanceContext } from './MediaCallInstanceContext';
import type { PeerInfo } from './definitions';
import { derivePeerInfoFromInstanceContact } from '../utils/derivePeerInfoFromInstanceContact';

export const usePeekMediaSessionPeerInfo = (): PeerInfo | undefined => {
	const { instance } = useMediaCallInstanceContext();

	const subscribe = useCallback(
		(onStoreChange: () => void): (() => void) => {
			if (!instance) {
				return () => undefined;
			}
			return instance?.on('sessionStateChange', onStoreChange);
		},
		[instance],
	);

	const getSnapshot = useCallback(() => {
		if (!instance) {
			return undefined;
		}
		const mainCall = instance.getMainCall();
		if (!mainCall) {
			return undefined;
		}
		const { contact } = mainCall;
		return derivePeerInfoFromInstanceContact(contact);
	}, [instance]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
