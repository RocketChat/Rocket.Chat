import { useMediaCallInstance } from './MediaCallInstanceContext.js';
import type { PeerInfo } from './definitions.js';
import { useInstanceSnapshot } from './useInstanceSnapshot.js';
import { derivePeerInfoFromInstanceState } from '../utils/derivePeerInfoFromInstanceState.js';

const areEqual = (a: PeerInfo | undefined, b: PeerInfo | undefined) => {
	if (!a || !b) {
		return a === b;
	}
	if (Object.keys(a).length !== Object.keys(b).length) {
		return false;
	}
	return Object.keys(a).every((key) => a[key as keyof PeerInfo] === b[key as keyof PeerInfo]);
};

export const usePeekMediaSessionPeerInfo = (): PeerInfo | undefined => {
	const { instance } = useMediaCallInstance();

	return useInstanceSnapshot(
		instance,
		(instance) => {
			const instanceState = instance?.getState();
			return instanceState ? derivePeerInfoFromInstanceState(instanceState) : undefined;
		},
		areEqual,
	);
};
