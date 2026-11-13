import { createContext, useContext, useSyncExternalStore } from 'react';

/** A track of the shared audio player, self-contained so playback outlives the message it came from. */
export type PersistentAudioTrack = {
	id: string;
	url: string;
	mediaType?: string;
	title: string;
	size?: number;
	rid?: string;
	mid?: string;
	username?: string;
	name?: string;
};

export type MediaPlayerValue = {
	track: PersistentAudioTrack | null;
	playing: boolean;
	currentTime: number;
	duration: number;
	playbackRate: number;
	play: (track: PersistentAudioTrack) => void;
	toggle: () => void;
	seek: (time: number) => void;
	cyclePlaybackRate: () => void;
	close: () => void;
	isActive: (id: string) => boolean;
};

/**
 * The shared player as something to subscribe to, so that only what shows its progress renders when it changes, not
 * everything that reads the media context.
 */
export type MediaPlayerStore = {
	subscribe: (onChange: () => void) => () => void;
	getSnapshot: () => MediaPlayerValue;
};

export type DocumentViewer = {
	/** Formats it opens besides PDF, such as `markdown`. */
	supportedFormats: string[];
	/** Opens a document in the viewer, under a title when it has one. */
	open: (url: string, format: string, title?: string) => void;
};

export type MessageMediaContextValue = {
	player: MediaPlayerStore;
	/** Downloads a file that has to be decrypted on the way. */
	downloadEncrypted: (link: string, title?: string) => void;
	/** Whether files that have to be decrypted on the way can be downloaded right now. */
	canDownloadEncrypted: boolean;
	openEncryptedPdf: (link: string, attachment: { title?: string; size?: number; format?: string }) => Promise<void>;
	/** The desktop app's document viewer, when there is one. */
	documentViewer: DocumentViewer | undefined;
	formatFileSize: (bytes: number) => string | null;
};

const noop = () => undefined;

const formatFileSize = (bytes: number) => {
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	const exponent = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), units.length - 1);
	return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
};

const defaultPlayer: MediaPlayerValue = {
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
};

/** A player store that starts from, and keeps, the given value until it is told to hold another one. */
export const createMediaPlayerStore = (
	initial: MediaPlayerValue = defaultPlayer,
): MediaPlayerStore & { set: (next: MediaPlayerValue) => void } => {
	let current = initial;
	const listeners = new Set<() => void>();

	return {
		subscribe: (onChange) => {
			listeners.add(onChange);
			return () => listeners.delete(onChange);
		},
		getSnapshot: () => current,
		set: (next) => {
			if (next === current) {
				return;
			}
			current = next;
			listeners.forEach((listener) => listener());
		},
	};
};

export const messageMediaDefaultValue: MessageMediaContextValue = {
	player: createMediaPlayerStore(),
	downloadEncrypted: noop,
	canDownloadEncrypted: true,
	openEncryptedPdf: async () => undefined,
	documentViewer: undefined,
	formatFileSize,
};

export const MessageMediaContext = createContext<MessageMediaContextValue>(messageMediaDefaultValue);

export const useMessageMedia = () => useContext(MessageMediaContext);

/** The shared player's state; the reader renders again whenever the player changes. */
export const useMessageMediaPlayer = (): MediaPlayerValue => {
	const { player } = useMessageMedia();

	return useSyncExternalStore(player.subscribe, player.getSnapshot);
};
