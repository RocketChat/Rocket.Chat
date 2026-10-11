import { useMediaCallInstance } from './MediaCallInstanceContext';
import type { PeerInfo } from './definitions';
import { useInstanceSnapshot } from './useInstanceSnapshot';
import { derivePeerInfoFromInstanceState } from '../utils/derivePeerInfoFromInstanceState';

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
