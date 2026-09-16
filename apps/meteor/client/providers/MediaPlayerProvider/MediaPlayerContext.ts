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
	 * Timestamp of the message the audio belongs to (used to match bulk-delete criteria).
	 * Only immutable message state is kept here: a track is replaced on the shared element
	 * only when its id changes, so anything that can change mid-playback would go stale.
	 */
	ts?: Date;
	/**
	 * Discussion room id the owning message links to (used to match bulk-delete criteria).
	 * A message is created with its `drid` and never gains or loses one, so this snapshot
	 * stays accurate for as long as the track lives.
	 */
	drid?: string;
	/**
	 * Whether the owning message is pinned (used to match bulk-delete criteria). Unlike `drid`
	 * this can change while the track is active, so the provider refreshes it from the rendered
	 * message; it can still drift while that message is unmounted.
	 */
	pinned?: boolean;
	/** When played from a quote, the id of the original message that holds the attachment (its deletion also closes the player). */
	originMid?: string;
	/** Timestamp of the original quoted message (used to match bulk-delete criteria). */
	originTs?: Date;
	/**
	 * Room of the original quoted message. A quote may point at another room, in which case the
	 * player also watches that room for deletions. Absent on quotes stored before the origin room
	 * was persisted, which fall back to assuming the quoting room.
	 */
	originRid?: string;
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
	/**
	 * Refreshes the mutable metadata of the active track when `next` describes it. Ignored when no
	 * track is active or `next` is a different one, so a re-rendering message can keep the player's
	 * copy of its own state current without disturbing playback.
	 */
	updateTrack: (next: PersistentAudioTrack) => void;
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
	updateTrack: noop,
	isActive: () => false,
});

export const useMediaPlayer = (): MediaPlayerContextValue => useContext(MediaPlayerContext);
