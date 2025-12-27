import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useRef } from 'react';

const getRemoteStream = (instance?: MediaSignalingSession) => {
	try {
		const mainCall = instance?.getMainCall();
		if (!mainCall) {
			return null;
		}

		if (mainCall.hidden) {
			return null;
		}

		return mainCall.getRemoteMediaStream();
	} catch (error) {
		console.error('MediaCall: useMediaStream - Error getting remote media stream', error);
		return null;
	}
};

const useMediaStream = (
	instance?: MediaSignalingSession,
): [(node: HTMLAudioElement | null) => void, { current: HTMLAudioElement | null }] => {
	const remoteStream = getRemoteStream(instance);
	const actualRef = useRef<HTMLAudioElement | null>(null);

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
