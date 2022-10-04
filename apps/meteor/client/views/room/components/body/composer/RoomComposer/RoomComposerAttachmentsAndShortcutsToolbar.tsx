import { Tooltip } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
// import { useSelectedDevices, useSetting } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { AudioRecorder } from '../../../../../../../app/ui/client/lib/recorderjs/audioRecorder';

// import { AudioRecorder } from '../../../../../../../app/ui';

// import RoomComposerFormattingToolbarAction from './RoomComposerFormattingToolbarAction';
// import { useRoomComposerAttachmentsShortcutActions } from './hooks/useRoomComposerAttachmentsShortcutActions';

const getUserMediaFallback = ((navigator) => {
	if (navigator.mediaDevices) {
		return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
	}

	const legacyGetUserMedia =
		navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	if (legacyGetUserMedia) {
		return (options) =>
			-new Promise((resolve, reject) => {
				legacyGetUserMedia.call(navigator, options, resolve, reject);
			});
	}
})(window.navigator);

const supported = Boolean(getUserMediaFallback);

const useGetUserMediaAudio = (): {
	state: 'granted' | 'pending' | 'not_supported' | 'denied';
	getUserMedia: (fn: (stream: MediaStream) => void) => void;
} => {
	const [state, setHasPermission] = useSafely(
		useState<'granted' | 'pending' | 'not_supported' | 'denied'>(supported ? 'pending' : 'not_supported'),
	);

	const getUserMedia = useCallback(
		(fn: (ms: MediaStream) => void) => {
			if (!getUserMediaFallback || typeof getUserMediaFallback !== 'function') {
				return;
			}

			getUserMediaFallback({ audio: true })
				.then((stream: MediaStream) => {
					fn(stream);
					setHasPermission('granted');
				})
				.catch(() => {
					setHasPermission('denied');
				});
		},
		[setHasPermission],
	);

	useEffect(() => {
		if (!supported) {
			return;
		}

		try {
			navigator.permissions.query({ name: 'microphone' } as any).then((permission) => {
				setHasPermission(
					({
						granted: 'granted',
						denied: 'denied',
						prompt: 'pending',
					}[permission.state] || 'pending') as 'granted' | 'pending' | 'denied',
				);

				permission.onchange = (): void => {
					setHasPermission(
						({
							granted: 'granted',
							denied: 'denied',
							prompt: 'pending',
						}[permission.state] || 'pending') as 'granted' | 'pending' | 'denied',
					);
				};
			});
		} catch (_) {
			if (navigator.mediaDevices) {
				navigator.mediaDevices.enumerateDevices().then((devices) => {
					setHasPermission(devices.some((device) => device.kind === 'audioinput' && device.label) ? 'granted' : 'pending');
				});
				return;
			}
			getUserMedia((stream) => {
				stream.getTracks().forEach((track) => track.stop());
			});
		}
	}, [getUserMedia, setHasPermission]);

	return {
		state,
		getUserMedia,
	};
};
const useAudioRecorderState = () => {
	const [subscribe, getSnapshot] = useMemo(() => {
		const callback = (cb: () => void): (() => void) => AudioRecorder.on('state', cb);

		const getSnapshot = () => AudioRecorder.state;
		return [callback, getSnapshot];
	}, []);

	return useSyncExternalStore(subscribe, getSnapshot);
};

const RoomComposerAttachmentsAndShortcutsToolbar = (): ReactElement => {
	const state = useAudioRecorderState();

	return (
		<>
			{state === 'recording' && (
				<>
					<Tooltip children='Tooltip' placement='top-middle' />
					<MessageComposerAction icon='mic-off' onClick={() => AudioRecorder.stop()} />
				</>
			)}
			{state !== 'recording' && <MessageComposerAction icon='mic' onClick={() => AudioRecorder.start()} />}
			<MessageComposerAction icon='video' />
			<MessageComposerAction icon='plus' />
		</>
	);
};

export default memo(RoomComposerAttachmentsAndShortcutsToolbar);
