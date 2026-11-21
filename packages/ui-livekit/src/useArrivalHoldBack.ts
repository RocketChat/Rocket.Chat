import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRef, useState } from 'react';

/**
 * Keeps LiveKit from publishing the camera on arrival while a background effect is wanted, until the camera has been
 * published with it. Decided once per join; `video` stays on afterwards, so a reconnect republishes the camera.
 */
export const useArrivalHoldBack = (connect: boolean, arriveWithCamera: boolean, effectWanted: boolean) => {
	const join = useRef<{ heldBack: boolean; taken: boolean } | undefined>(undefined);
	const [published, setPublished] = useState(false);

	if (!connect) {
		join.current = undefined;
		if (published) {
			setPublished(false);
		}
	} else {
		join.current ??= { heldBack: arriveWithCamera && effectWanted, taken: false };
	}

	const video = arriveWithCamera && (!join.current?.heldBack || published);

	/** True once per join when the camera was held back, for the caller to start it with its effect. */
	const takeHeldBackCamera = useStableCallback(() => {
		if (!join.current?.heldBack || join.current.taken) {
			return false;
		}
		join.current.taken = true;
		return true;
	});

	const markPublished = useStableCallback(() => setPublished(true));

	return { video, takeHeldBackCamera, markPublished };
};
