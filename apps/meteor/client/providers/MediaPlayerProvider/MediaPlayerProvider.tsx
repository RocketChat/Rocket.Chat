import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { MediaPlayerContextValue, PersistentAudioTrack } from './MediaPlayerContext';
import { MediaPlayerContext } from './MediaPlayerContext';

const PLAYBACK_RATES = [1, 1.5, 2] as const;

function toURL(urlString: string): URL {
	try {
		return new URL(urlString);
	} catch {
		return new URL(urlString, window.location.href);
	}
}

const getRedirectURLInfo = async (url: string): Promise<{ redirectUrl: string | false; expires: number | null }> => {
	const _url = toURL(url);
	_url.searchParams.set('replyWithRedirectUrl', 'true');
	const response = await fetch(_url, { credentials: 'same-origin' });

	if (!response.ok) {
		throw new Error(`Failed to fetch URL info: ${response.statusText}`);
	}

	const data = await response.json();

	return {
		redirectUrl: data.redirectUrl,
		expires: data.expires ? new Date(data.expires).getTime() : null,
	};
};

type MediaPlayerProviderProps = {
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

	// Keep the live track in a ref so the (stable) recovery handler can read it.
	const trackRef = useRef<PersistentAudioTrack | null>(null);
	trackRef.current = track;

	// --- Signed-URL recovery, mirroring useReloadOnError for the shared element.
	const expiresAtRef = useRef<number | null>(null);
	const isRecoveringRef = useRef(false);
	const firstRecoveryAttemptedRef = useRef(false);

	const handleMediaURLRecovery = useStableCallback(async (event: Event) => {
		const node = event.target as HTMLMediaElement | null;
		const { current } = trackRef;
		if (!node || !current) {
			return;
		}

		if (isRecoveringRef.current) {
			return;
		}

		// Decide whether recovery is warranted *before* marking as busy, so these
		// early exits never leave the flag stuck (which would block all future recovery).
		if (!expiresAtRef.current && firstRecoveryAttemptedRef.current) {
			return;
		}
		firstRecoveryAttemptedRef.current = true;
		if (expiresAtRef.current && Date.now() < expiresAtRef.current) {
			return;
		}

		isRecoveringRef.current = true;
		const wasPlaying = !node.paused;
		const { currentTime: time } = node;

		try {
			const { redirectUrl: newUrl, expires } = await getRedirectURLInfo(current.resolveUrl?.() || current.url);
			// The active track may have been switched/closed while the request was in flight.
			if (trackRef.current?.id !== current.id) {
				isRecoveringRef.current = false;
				return;
			}
			expiresAtRef.current = expires;
			node.src = newUrl || current.url;

			const onCanPlay = async () => {
				node.removeEventListener('canplay', onCanPlay);
				node.currentTime = time;
				if (wasPlaying) {
					try {
						await node.play();
					} catch (playError) {
						console.warn('Failed to resume playback after URL recovery:', playError);
					}
				}
			};

			node.addEventListener('canplay', onCanPlay, { once: true });
			node.addEventListener(
				'loadedmetadata',
				() => {
					isRecoveringRef.current = false;
				},
				{ once: true },
			);
			node.load();
		} catch (err) {
			console.error('Error during media URL recovery:', err);
			isRecoveringRef.current = false;
		}
	});

	const audioCallback = useCallback((node: HTMLAudioElement | null) => {
		audioRef.current = node;
	}, []);

	const play = useStableCallback((next: PersistentAudioTrack) => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}

		if (trackRef.current?.id !== next.id) {
			expiresAtRef.current = null;
			firstRecoveryAttemptedRef.current = false;
			isRecoveringRef.current = false;
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

	const value = useMemo<MediaPlayerContextValue>(
		() => ({ track, playing, currentTime, duration, playbackRate, play, toggle, seek, cyclePlaybackRate, close, isActive }),
		[track, playing, currentTime, duration, playbackRate, play, toggle, seek, cyclePlaybackRate, close, isActive],
	);

	return (
		<MediaPlayerContext.Provider value={value}>
			{children}
			<audio
				ref={audioCallback}
				hidden
				preload='metadata'
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onEnded={() => close()}
				onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
				onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
				onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
				onRateChange={(e) => setPlaybackRate(e.currentTarget.playbackRate)}
				onError={(e) => handleMediaURLRecovery(e.nativeEvent)}
				onStalled={(e) => handleMediaURLRecovery(e.nativeEvent)}
			>
				<track kind='captions' />
			</audio>
		</MediaPlayerContext.Provider>
	);
};

export default MediaPlayerProvider;
