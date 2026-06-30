import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect, useRef } from 'react';

import { useMediaPlayer } from '../../../../../../providers/MediaPlayerProvider';
import type { PersistentAudioTrack } from '../../../../../../providers/MediaPlayerProvider';

/**
 * Wires a message's native `<audio>` element to the persistent player without
 * altering the message UI:
 *
 * - When the element starts playing, it takes over from the persistent player.
 * - When the message unmounts while playing (room switch/close, scroll-out), the
 *   track is handed off to the persistent player so playback continues there.
 *
 * Playback is NOT handed back into the message element on return: the message
 * player is a controlled fuselage component, so co-driving its element is
 * unreliable (and would be blocked by autoplay policy). Instead the audio keeps
 * playing in the persistent card; pressing play in the message takes over again.
 *
 * Returns a ref callback to attach to the audio element (merge with others).
 */
export const usePersistentAudio = (track: PersistentAudioTrack | null) => {
	const { adoptFromMessage, stopPersistent } = useMediaPlayer();

	// Latest playback snapshot, kept in a ref so the unmount cleanup can read it
	// even after the element has been detached.
	const stateRef = useRef({ currentTime: 0, playing: false });
	const trackRef = useRef(track);
	trackRef.current = track;

	const refCallback = useSafeRefCallback(
		useCallback(
			(node: HTMLAudioElement) => {
				const onTimeUpdate = () => {
					stateRef.current.currentTime = node.currentTime;
				};
				const onPlay = () => {
					stateRef.current.playing = true;
					// This element is now the source of truth; stop the detached player.
					stopPersistent();
				};
				const onPauseOrEnded = () => {
					stateRef.current.playing = false;
				};

				node.addEventListener('timeupdate', onTimeUpdate);
				node.addEventListener('play', onPlay);
				node.addEventListener('pause', onPauseOrEnded);
				node.addEventListener('ended', onPauseOrEnded);

				return () => {
					node.removeEventListener('timeupdate', onTimeUpdate);
					node.removeEventListener('play', onPlay);
					node.removeEventListener('pause', onPauseOrEnded);
					node.removeEventListener('ended', onPauseOrEnded);
				};
			},
			[stopPersistent],
		),
	);

	// Hand the track off to the persistent player when the message unmounts
	// mid-playback (room switch/close, scroll-out), so playback continues.
	useEffect(() => {
		// `state` is a stable mutable object (never reassigned), so capturing it here
		// lets the cleanup read the latest snapshot without the ref-staleness pitfall.
		const state = stateRef.current;
		return () => {
			if (state.playing && trackRef.current) {
				adoptFromMessage(trackRef.current, state.currentTime, true);
			}
		};
		// Re-run on track identity change; adoptFromMessage is a stable callback.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [track?.id]);

	return refCallback;
};
