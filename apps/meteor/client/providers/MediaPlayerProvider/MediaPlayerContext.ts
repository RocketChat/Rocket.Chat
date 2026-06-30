import { createContext, useContext } from 'react';

/**
 * Describes a single audio track owned by the shared player.
 * The descriptor is self-contained so the player keeps working after the message
 * (and the room) that originated it has been unmounted — the underlying `<audio>`
 * element lives in the provider and is never recreated on navigation.
 */
export type PersistentAudioTrack = {
	/** Stable identity of the track, e.g. `${mid}:${url}`. */
	id: string;
	/** Resolved, ready-to-play media URL. */
	url: string;
	/** MIME type of the media, when known. */
	mediaType?: string;
	/** File name shown in the player. */
	title: string;
	/** File size in bytes, when known. */
	size?: number;
	/** Room the audio was sent in (enables "jump back to conversation"). */
	rid?: string;
	/** Message the audio belongs to (enables jump-to-message). */
	mid?: string;
	/** Username of the sender (drives the avatar). */
	username?: string;
	/** Display name of the sender. */
	name?: string;
	/**
	 * Re-resolves a fresh media URL. Used to recover from signed-URL expiry while
	 * the track keeps playing. Returns `undefined` to fall back to {@link PersistentAudioTrack.url}.
	 */
	resolveUrl?: () => string | undefined;
};

export type MediaPlayerContextValue = {
	track: PersistentAudioTrack | null;
	playing: boolean;
	currentTime: number;
	duration: number;
	playbackRate: number;
	/** Loads (only if a different track) and plays the given track in the shared element. */
	play: (track: PersistentAudioTrack) => void;
	/** Toggles play/pause for the active track. No-op when no track is active. */
	toggle: () => void;
	/** Seeks the active track to `time` seconds. */
	seek: (time: number) => void;
	/** Cycles the playback rate 1x → 1.5x → 2x → 1x. */
	cyclePlaybackRate: () => void;
	/** Stops playback and clears the active track. */
	close: () => void;
	/** Whether the given track id is the one currently owned by the shared element. */
	isActive: (id: string) => boolean;
};

const noop = () => undefined;

export const MediaPlayerContext = createContext<MediaPlayerContextValue>({
	track: null,
	playing: false,
	currentTime: 0,
	duration: 0,
	playbackRate: 1,
	play: noop,
	toggle: noop,
	seek: noop,
	cyclePlaybackRate: noop,
	close: noop,
	isActive: () => false,
});

export const useMediaPlayer = (): MediaPlayerContextValue => useContext(MediaPlayerContext);
