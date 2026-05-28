import type { IMediaStreamWrapper, MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useEffect, useState } from 'react';

import type { MediaCallStreams } from '../context/MediaCallViewContext';

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

		const localScreen = localParticipant.getMediaStream('screen-share');
		const remoteScreen = remoteParticipant.getMediaStream('screen-share');
		const localCamera = localParticipant.getMediaStream('camera');
		const remoteCamera = remoteParticipant.getMediaStream('camera');

		return {
			localScreen: localScreen ?? undefined,
			remoteScreen: remoteScreen ?? undefined,
			localCamera: localCamera ?? undefined,
			remoteCamera: remoteCamera ?? undefined,
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

const emptyStreams: MediaCallStreams = {
	remoteScreen: undefined,
	localScreen: undefined,
	remoteCamera: undefined,
	localCamera: undefined,
};

export const useScreenShareStreams = (instance?: MediaSignalingSession) => {
	const [streams, setStreams] = useState<MediaCallStreams>(emptyStreams);

	useEffect(() => {
		if (!instance) {
			setStreams(emptyStreams);
			return;
		}

		const syncRemoteStream = () => {
			const next = getStreamWrappers(instance);
			setStreams((oldStreams) => {
				if (!next) {
					return emptyStreams;
				}
				if (
					areStreamsEqual(oldStreams.localScreen, next.localScreen) &&
					areStreamsEqual(oldStreams.remoteScreen, next.remoteScreen) &&
					areStreamsEqual(oldStreams.localCamera, next.localCamera) &&
					areStreamsEqual(oldStreams.remoteCamera, next.remoteCamera)
				) {
					return oldStreams;
				}
				return next;
			});
		};

		syncRemoteStream();

		return instance.on('sessionStateChange', () => {
			syncRemoteStream();
		});
	}, [instance]);

	return streams;
};
