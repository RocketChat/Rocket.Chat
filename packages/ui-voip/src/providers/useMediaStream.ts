import { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback } from 'react';

const useMediaStream = (instance?: MediaSignalingSession) => {
	// TODO: Check if this actually works (infinite loop? stream does not update?)
	// It could happen that the stream changes, but the instance does not update, causing the stream to not update
	// Meaning the callback wont run.
	// It's probably best to make this an externalStore and use the events.
	const remoteStream = instance?.getMainCall()?.getRemoteMediaStream();

	return useSafeRefCallback(
		useCallback(
			async (node: HTMLAudioElement | null) => {
				if (!node || !remoteStream) {
					return;
				}

				try {
					node.srcObject = remoteStream;
					await node.play();
				} catch (error) {
					console.error('MediaCall: useMediaStream - Error getting/playing media stream', error);
				}

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
