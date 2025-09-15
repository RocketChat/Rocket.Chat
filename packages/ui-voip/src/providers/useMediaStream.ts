import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useRef } from 'react';

const useMediaStream = (
	instance?: MediaSignalingSession,
): [(node: HTMLAudioElement | null) => void, { current: HTMLAudioElement | null }] => {
	const remoteStream = instance?.getMainCall()?.getRemoteMediaStream();
	const actualRef = useRef<HTMLAudioElement | null>(null);

	return [
		useSafeRefCallback(
			useCallback(
				(node) => {
					// TODO remove node check when useSafeRefCallback is updated from fuselage.
					if (!remoteStream || !node) {
						return;
					}

					actualRef.current = node;

					node.srcObject = remoteStream;
					node.play().catch((error) => {
						console.error('MediaCall: useMediaStream - Error playing media stream', error);
					});

					return () => {
						actualRef.current = null;
						node.pause();
						node.srcObject = null;
					};
				},
				[remoteStream],
			),
		),
		actualRef,
	];
};

export default useMediaStream;
