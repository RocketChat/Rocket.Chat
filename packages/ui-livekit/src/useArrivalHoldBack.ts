import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEffect, useRef, useState } from 'react';

/**
 * Keeps LiveKit from publishing the camera on arrival while a background effect is wanted, until the camera has been
 * published with it. Decided once per join; `video` stays on afterwards, so a reconnect republishes the camera.
 */
export const useArrivalHoldBack = (connect: boolean, arriveWithCamera: boolean, effectWanted: boolean) => {
	const [decided, setDecided] = useState<boolean>();
	const [published, setPublished] = useState(false);
	const taken = useRef(false);

	if (connect && decided === undefined) {
		setDecided(arriveWithCamera && effectWanted);
	}
	if (!connect && decided !== undefined) {
		setDecided(undefined);
		setPublished(false);
	}

	useEffect(() => {
		if (!connect) {
			taken.current = false;
		}
	}, [connect]);

	const heldBack = connect && (decided ?? (arriveWithCamera && effectWanted));
	const video = arriveWithCamera && (!heldBack || published);

	/** True once per join when the camera was held back, for the caller to start it with its effect. */
	const takeHeldBackCamera = useStableCallback(() => {
		if (!heldBack || taken.current) {
			return false;
		}
		taken.current = true;
		return true;
	});

	const markPublished = useStableCallback(() => setPublished(true));

	return { video, takeHeldBackCamera, markPublished };
};
