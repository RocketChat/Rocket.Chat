import { useCallback } from 'preact/hooks';

import { useStore } from '../../../store';

export const useStopSound = () => {
	const { dispatch, sound = {} } = useStore();

	return useCallback(() => {
		dispatch({ sound: { ...sound, play: false, enabled: false } });
	}, [dispatch, sound]);
};
