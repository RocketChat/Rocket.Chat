import type { IMediaStreamWrapper, MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useEffect, useState } from 'react';

import type { MediaCallStreams } from '../context/MediaCallViewContext';

const getStreamWrappers = (instance?: MediaSignalingSession) => {
	try {
		const mainCall = instance?.getMainCall();
		if (!mainCall) {
			return null;
		}

		const localStream = mainCall.getLocalMediaStream('screen-share');

		const remoteStream = mainCall.getRemoteMediaStream('screen-share');

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

export const useScreenShareStreams = (instance?: MediaSignalingSession) => {
	const [streams, setStreams] = useState<MediaCallStreams>({
		remoteScreen: undefined,
		localScreen: undefined,
	});

	useEffect(() => {
		if (!instance) {
			setStreams({
				remoteScreen: undefined,
				localScreen: undefined,
			});
			return;
		}

		const syncRemoteStream = () => {
			const next = getStreamWrappers(instance);
			setStreams((oldStreams) => {
				if (!next) {
					return {
						remoteScreen: undefined,
						localScreen: undefined,
					};
				}
				if (areStreamsEqual(oldStreams.localScreen, next.localScreen) && areStreamsEqual(oldStreams.remoteScreen, next.remoteScreen)) {
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
