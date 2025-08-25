import { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback } from 'react';

const useMediaStream = (instance?: MediaSignalingSession) => {
	const remoteStream = instance?.getMainCall()?.getRemoteMediaStream();

	return useSafeRefCallback(
		useCallback(
			(node: HTMLAudioElement) => {
				// TODO remove node check when useSafeRefCallback is updated from fuselage.
				if (!remoteStream || !node) {
					return;
				}

				node.srcObject = remoteStream;
				node.play().catch((error) => {
					console.error('MediaCall: useMediaStream - Error playing media stream', error);
				});

				return () => {
					node.pause();
					node.srcObject = null;
				};
			},
			[remoteStream],
		),
	);
};

export default useMediaStream;
