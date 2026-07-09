import { useCallback, useSyncExternalStore } from 'react';

import { useMediaCallInstance } from './MediaCallInstanceContext';

export const usePeekMediaSessionHidden = (): boolean => {
	const { instance } = useMediaCallInstance();

	const subscribe = useCallback(
		(onStoreChange: () => void): (() => void) => {
			if (!instance) {
				return () => undefined;
			}

			const offCbs = [instance.on('sessionStateChange', onStoreChange), instance.on('hiddenCall', onStoreChange)];

			return () => {
				offCbs.forEach((offCb) => offCb());
			};
		},
		[instance],
	);

	const getSnapshot = useCallback(() => {
		if (!instance) {
			return false;
		}

		const instanceState = instance.getState();

		return instanceState?.hidden ?? false;
	}, [instance]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
