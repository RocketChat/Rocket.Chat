import type { CallFeature } from '@rocket.chat/media-signaling';

import { useMediaCallInstance } from './MediaCallInstanceContext';
import { useInstanceSnapshot } from './useInstanceSnapshot';

export type PeekMediaSessionFeaturesReturn = readonly CallFeature[];

const areEqual = (a: PeekMediaSessionFeaturesReturn, b: PeekMediaSessionFeaturesReturn) => {
	if (a.length !== b.length) {
		return false;
	}
	return a.every((feature) => b.includes(feature));
};

const emptyFeatures: PeekMediaSessionFeaturesReturn = [];

export const usePeekMediaSessionFeatures = (): PeekMediaSessionFeaturesReturn => {
	const { instance } = useMediaCallInstance();

	return useInstanceSnapshot(
		instance,
		(instance) => {
			const instanceState = instance?.getState();
			return instanceState?.confirmed ? instanceState.features : emptyFeatures;
		},
		areEqual,
	);
};
