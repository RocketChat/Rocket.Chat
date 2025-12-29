import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useRef } from 'react';

type HTMLMediaElement = HTMLAudioElement | HTMLVideoElement;

const useMediaStream = (
	remoteStream: MediaStream | null,
): [(node: HTMLMediaElement | null) => void, { current: HTMLMediaElement | null }] => {
	const actualRef = useRef<HTMLMediaElement | null>(null);

	return [
		useSafeRefCallback(
			useCallback(
				(node) => {
					// TODO remove node check when useSafeRefCallback is updated from fuselage.
					if (!node) {
						return;
					}

					actualRef.current = node;

					if (!remoteStream) {
						return;
					}

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
