import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { backgroundImageStore } from '../backgrounds/lib/backgroundImageStore';

const subscribe = (listener: () => void) => backgroundImageStore.on('change', listener);

/** The participant's own background pictures, kept in this browser per account and never uploaded. */
export const useBackgroundImages = () => {
	const uid = useUserId() ?? '';

	useEffect(() => backgroundImageStore.load(uid), [uid]);

	const { images, loaded } = useSyncExternalStore(subscribe, () => backgroundImageStore.get(uid));

	const addImage = useCallback((file: File) => backgroundImageStore.add(uid, file), [uid]);
	const removeImage = useCallback((id: string) => backgroundImageStore.remove(uid, id), [uid]);

	return { images, loaded, addImage, removeImage };
};
