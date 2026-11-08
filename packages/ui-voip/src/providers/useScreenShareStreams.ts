import type { IMediaStreamWrapper, MediaSignalingSession } from '@rocket.chat/media-signaling';

import type { MediaCallStreams } from '../context/MediaCallViewContext';
import { useInstanceSnapshot } from '../context/useInstanceSnapshot';

const getStreamWrappers = (instance?: MediaSignalingSession) => {
	try {
		const instanceState = instance?.getState();
		if (!instanceState) {
			return null;
		}

		if (!instanceState.confirmed) {
			return null;
		}

		const { localParticipant, remoteParticipant } = instanceState;

		const localStream = localParticipant.getMediaStream('screen-share');

		const remoteStream = remoteParticipant.getMediaStream('screen-share');

		return {
			localScreen: localStream ?? undefined,
			remoteScreen: remoteStream ?? undefined,
		};
	} catch (error) {
		console.error('MediaCall: useMediaStream - Error getting local media stream', error);
		return null;
	}
};

const areStreamsEqual = (a?: IMediaStreamWrapper, b?: IMediaStreamWrapper) => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	return a.stream.id === b.stream.id;
};

const noStreams: MediaCallStreams = { remoteScreen: undefined, localScreen: undefined };

export const useScreenShareStreams = (instance?: MediaSignalingSession): MediaCallStreams =>
	useInstanceSnapshot(
		instance,
		(instance) => getStreamWrappers(instance) ?? noStreams,
		(a, b) => areStreamsEqual(a.localScreen, b.localScreen) && areStreamsEqual(a.remoteScreen, b.remoteScreen),
	);
