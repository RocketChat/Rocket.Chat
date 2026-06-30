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
 *   track is handed off to the persistent player so playback continues.
 * - When the message mounts while the persistent player owns the same track, the
 *   track is handed back and resumes in the message element.
 *
 * Returns a ref callback to attach to the audio element (merge with others).
 */
export const usePersistentAudio = (track: PersistentAudioTrack | null) => {
	const { adoptFromMessage, claimFromPersistent, stopPersistent } = useMediaPlayer();

	// Latest playback snapshot, kept in a ref so the unmount cleanup can read it
	// even after the element has been detached.
	const stateRef = useRef({ currentTime: 0, playing: false });
	const elementRef = useRef<HTMLAudioElement | null>(null);
	const trackRef = useRef(track);
	trackRef.current = track;

	const refCallback = useSafeRefCallback(
		useCallback(
			(node: HTMLAudioElement) => {
				elementRef.current = node;

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

	// Hand the track back from the persistent player when (re-)entering the
	// message, and hand it off again when the message unmounts mid-playback.
	useEffect(() => {
		const node = elementRef.current;
		const { current } = trackRef;
		// `state` is a stable mutable object (never reassigned), so capturing it here
		// lets the cleanup read the latest snapshot without the ref-staleness pitfall.
		const state = stateRef.current;
		if (!node || !current) {
			return undefined;
		}

		const claimed = claimFromPersistent(current.id);
		if (claimed) {
			const resume = () => {
				node.currentTime = claimed.currentTime;
				state.currentTime = claimed.currentTime;
				if (claimed.playing) {
					node.play().catch((err) => console.warn('Failed to resume in-message playback:', err));
				}
			};
			if (node.readyState >= 1) {
				resume();
			} else {
				node.addEventListener('loadedmetadata', resume, { once: true });
			}
		}

		return () => {
			if (state.playing && trackRef.current) {
				adoptFromMessage(trackRef.current, state.currentTime, true);
			}
		};
		// Re-run on track identity change; adopt/claim are stable callbacks.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [track?.id]);

	return refCallback;
};
