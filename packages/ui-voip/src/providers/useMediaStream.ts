import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useCallback, useEffect, useRef, useState } from 'react';

const getRemoteStream = (instance?: MediaSignalingSession) => {
	try {
		const mainCall = instance?.getMainCall();
		if (!mainCall) {
			return null;
		}

		if (mainCall.hidden) {
			return null;
		}

		return mainCall.getRemoteMediaStream()?.stream || null;
	} catch (error) {
		console.error('MediaCall: useMediaStream - Error getting remote media stream', error);
		return null;
	}
};

const useMediaStream = (
	instance?: MediaSignalingSession,
): [(node: HTMLAudioElement | null) => void, { current: HTMLAudioElement | null }] => {
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
	const actualRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		if (!instance) {
			return;
		}
		return instance.on('sessionStateChange', () => {
			const remoteStream = getRemoteStream(instance);
			if (!remoteStream) {
				return;
			}
			setRemoteStream((oldStream) => {
				if (oldStream === remoteStream) {
					return oldStream;
				}
				return remoteStream;
			});
		});
	}, [instance]);

	return [
		useSafeRefCallback(
			useCallback(
				(node: HTMLAudioElement) => {
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
