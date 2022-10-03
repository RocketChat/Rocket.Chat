import { useSafely } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
// import { useSelectedDevices, useSetting } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, useCallback, useEffect, useState } from 'react';

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

// .match(/audio\/mp3|audio\/\*/i
const RoomComposerAttachmentsAndShortcutsToolbar = (): ReactElement => {
	const { state, getUserMedia } = useGetUserMediaAudio();
	return (
		<>
			{state === 'denied' && <MessageComposerAction icon='mic-off' disabled />}
			{state !== 'denied' && <MessageComposerAction icon='mic' onClick={() => getUserMedia(console.log)} />}
			<MessageComposerAction icon='video' />
			<MessageComposerAction icon='plus' />
		</>
	);
};

export default memo(RoomComposerAttachmentsAndShortcutsToolbar);
