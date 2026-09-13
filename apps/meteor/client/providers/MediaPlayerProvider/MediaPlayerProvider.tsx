import { useMergedRefs, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MediaPlayerContextValue, PersistentAudioTrack } from './MediaPlayerContext';
import { MediaPlayerContext } from './MediaPlayerContext';
import { useReloadOnError } from '../../components/message/content/attachments/file/hooks/useReloadOnError';
import { Messages } from '../../stores';

const PLAYBACK_RATES = [1, 1.5, 2] as const;

export type MediaPlayerProviderProps = {
	children?: ReactNode;
};

/**
 * Owns the single, app-wide `<audio>` element used to play message audio
 * attachments. Because the element lives above the room layout and is never
 * recreated, both the in-message controls and the sidebar card drive the very
 * same element: switching or closing the room only swaps which UI is shown — the
 * element keeps playing with no reload, seek, or gap.
 */
const MediaPlayerProvider = ({ children }: MediaPlayerProviderProps) => {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const [track, setTrack] = useState<PersistentAudioTrack | null>(null);
	const [playing, setPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [playbackRate, setPlaybackRate] = useState<number>(1);
	const userId = useUserId();

	const trackRef = useRef<PersistentAudioTrack | null>(null);
	trackRef.current = track;

	// Reuse the message player's signed-URL recovery on the shared element.
	const { mediaRef } = useReloadOnError(track?.url ?? '', 'audio');
	const audioCallback = useCallback((node: HTMLAudioElement | null) => {
		audioRef.current = node;
	}, []);
	const setAudioRef = useMergedRefs(audioCallback, mediaRef);

	const play = useStableCallback((next: PersistentAudioTrack) => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}

		if (trackRef.current?.id !== next.id) {
			setTrack(next);
			setCurrentTime(0);
			setDuration(0);
			audio.src = next.url;
			audio.load();
		}

		audio.playbackRate = playbackRate;
		audio.play().catch((err) => console.warn('Failed to start audio playback:', err));
	});

	const toggle = useStableCallback(() => {
		const audio = audioRef.current;
		if (!audio || !trackRef.current) {
			return;
		}
		if (audio.paused) {
			audio.play().catch((err) => console.warn('Failed to resume audio playback:', err));
		} else {
			audio.pause();
		}
	});

	const seek = useStableCallback((time: number) => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}
		audio.currentTime = Math.max(0, Math.min(time, audio.duration || time));
	});

	const cyclePlaybackRate = useStableCallback(() => {
		setPlaybackRate((rate) => {
			const idx = PLAYBACK_RATES.indexOf(rate as (typeof PLAYBACK_RATES)[number]);
			const nextRate = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
			if (audioRef.current) {
				audioRef.current.playbackRate = nextRate;
			}
			return nextRate;
		});
	});

	const close = useStableCallback(() => {
		const audio = audioRef.current;
		if (audio) {
			audio.pause();
			audio.removeAttribute('src');
			audio.load();
		}
		setTrack(null);
		setPlaying(false);
		setCurrentTime(0);
		setDuration(0);
	});

	const isActive = useCallback((id: string) => trackRef.current?.id === id, []);
	const subscribeToNotifyRoom = useStream('notify-room');
	const subscribeToNotifyUser = useStream('notify-user');

	//For hard message delete, when Message Message_ShowDeletedStatus is off
	useEffect(() => {
		if (!track) {
			return;
		}

		const { rid, mid } = track;

		if (!rid || !mid) {
			return;
		}

		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${rid}/deleteMessage`, ({ _id }) => {
			if (_id === mid) {
				close();
			}
		});

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${rid}/deleteMessageBulk`, ({ ids }) => {
			if (ids?.includes(mid)) {
				close();
			}
		});

		return () => {
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
		};
	}, [track, subscribeToNotifyRoom, close]);

	//For soft message delete, when Message_ShowDeletedStatus is on and server updates message.t to rm
	useEffect(() => {
		if (!track) {
			return;
		}

		const unsub = Messages.use.subscribe((state, prevState) => {
			const { mid } = track;
			if (!mid) {
				return;
			}

			const message = state.records.get(mid);

			if (message && message !== prevState.records.get(mid) && message.t === 'rm') {
				close();
			}
		});

		return unsub;
	}, [track, close]);

	useEffect(() => {
		if (!track || !userId) {
			return;
		}

		const { rid } = track;

		if (!rid) {
			return;
		}

		return subscribeToNotifyUser(`${userId}/subscriptions-changed`, (event, subscription) => {
			if (event === 'removed' && subscription.rid === rid) {
				close();
			}
		});
	}, [userId, subscribeToNotifyUser, track, close]);

	const value = useMemo<MediaPlayerContextValue>(
		() => ({ track, playing, currentTime, duration, playbackRate, play, toggle, seek, cyclePlaybackRate, close, isActive }),
		[track, playing, currentTime, duration, playbackRate, play, toggle, seek, cyclePlaybackRate, close, isActive],
	);

	return (
		<MediaPlayerContext.Provider value={value}>
			{children}
			<audio
				ref={setAudioRef}
				hidden
				preload='metadata'
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onEnded={() => close()}
				onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
				onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
				onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
				onRateChange={(e) => setPlaybackRate(e.currentTarget.playbackRate)}
			>
				<track kind='captions' />
			</audio>
		</MediaPlayerContext.Provider>
	);
};

export default MediaPlayerProvider;
