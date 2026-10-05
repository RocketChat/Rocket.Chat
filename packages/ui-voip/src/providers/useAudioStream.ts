import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { usePlayMediaStream } from '@rocket.chat/ui-media';

import { useInstanceSnapshot } from '../context/useInstanceSnapshot';

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
	const remoteStream = useInstanceSnapshot(instance, getAudioStream);

	return usePlayMediaStream(remoteStream);
};
