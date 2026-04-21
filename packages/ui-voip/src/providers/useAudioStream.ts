import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useEffect, useState } from 'react';

import { usePlayMediaStream } from './usePlayMediaStream';

const getAudioStream = (instance?: MediaSignalingSession) => {
	try {
		const instanceState = instance?.getState();
		if (!instanceState?.confirmed) {
			return null;
		}

		if (instanceState.hidden) {
			return null;
		}

		return instanceState.remoteParticipant.getMediaStream('main')?.stream || null;
	} catch (error) {
		console.error('MediaCall: useAudioStream - Error getting remote media stream (main audio)', error);
		return null;
	}
};

export const useAudioStream = (instance?: MediaSignalingSession) => {
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

	useEffect(() => {
		if (!instance) {
			setRemoteStream(null);
			return;
		}

		const syncRemoteStream = () => {
			const nextStream = getAudioStream(instance);
			setRemoteStream((oldStream) => {
				if (!nextStream) {
					return null;
				}
				return oldStream === nextStream ? oldStream : nextStream;
			});
		};

		syncRemoteStream();

		return instance.on('sessionStateChange', () => {
			syncRemoteStream();
		});
	}, [instance]);

	return usePlayMediaStream(remoteStream);
};
