import { createContext, useContext } from 'react';

/**
 * Describes a single audio track that the persistent player can own.
 * The descriptor is fully self-contained so the player keeps working after the
 * message (and the room) that originated it has been unmounted.
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
	 * the track keeps playing in the persistent player. Returns `undefined` to
	 * fall back to {@link PersistentAudioTrack.url}.
	 */
	resolveUrl?: () => string | undefined;
};

/** Snapshot handed between the in-message audio element and the persistent player. */
export type AudioHandoffState = {
	currentTime: number;
	playing: boolean;
};

export type MediaPlayerContextValue = {
	/** Track currently owned by the persistent (detached) player; null when idle or playing in-room. */
	track: PersistentAudioTrack | null;
	playing: boolean;
	currentTime: number;
	duration: number;
	playbackRate: number;

	// --- Controls used by the persistent player UI (operate on the shared element).
	/** Toggles play/pause for the detached track. */
	toggle: () => void;
	/** Seeks the detached track to `time` seconds. */
	seek: (time: number) => void;
	/** Cycles the playback rate 1x → 1.5x → 2x → 1x. */
	cyclePlaybackRate: () => void;
	/** Stops playback and clears the active track. */
	close: () => void;

	// --- Hand-off between an in-message audio element and the persistent player.
	/** Adopts a track that was playing in a message which is being unmounted, continuing playback. */
	adoptFromMessage: (track: PersistentAudioTrack, currentTime: number, wasPlaying: boolean) => void;
	/** If the persistent player owns `id`, stops it and returns its state so the message element can resume. */
	claimFromPersistent: (id: string) => AudioHandoffState | null;
	/** Stops the persistent player (e.g. when an in-message element takes over playback). */
	stopPersistent: () => void;
};

const noop = () => undefined;

export const MediaPlayerContext = createContext<MediaPlayerContextValue>({
	track: null,
	playing: false,
	currentTime: 0,
	duration: 0,
	playbackRate: 1,
	toggle: noop,
	seek: noop,
	cyclePlaybackRate: noop,
	close: noop,
	adoptFromMessage: noop,
	claimFromPersistent: () => null,
	stopPersistent: noop,
});

export const useMediaPlayer = (): MediaPlayerContextValue => useContext(MediaPlayerContext);
