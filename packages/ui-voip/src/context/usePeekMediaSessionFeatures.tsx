import type { CallFeature } from '@rocket.chat/media-signaling';
import { useCallback, useRef, useSyncExternalStore } from 'react';

import { useMediaCallInstance } from './MediaCallInstanceContext';

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
	const cache = useRef<PeekMediaSessionFeaturesReturn>([]);

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
			return emptyFeatures;
		}

		const mainCall = instance.getMainCall();
		if (!mainCall) {
			return emptyFeatures;
		}
		const { features } = mainCall;

		if (!cache.current || !areEqual(features, cache.current)) {
			cache.current = features;
			return features;
		}
		return cache.current;
	}, [instance]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
