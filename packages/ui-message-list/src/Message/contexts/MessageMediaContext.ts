import { createContext, useContext } from 'react';

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

export type DocumentViewer = {
	/** Formats it opens besides PDF, such as `markdown`. */
	supportedFormats: string[];
	open: (url: string, format: string) => void;
};

export type MessageMediaContextValue = {
	player: MediaPlayerValue;
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

export const messageMediaDefaultValue: MessageMediaContextValue = {
	player: {
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
	},
	downloadEncrypted: noop,
	canDownloadEncrypted: true,
	openEncryptedPdf: async () => undefined,
	documentViewer: undefined,
	formatFileSize,
};

export const MessageMediaContext = createContext<MessageMediaContextValue>(messageMediaDefaultValue);

export const useMessageMedia = () => useContext(MessageMediaContext);
