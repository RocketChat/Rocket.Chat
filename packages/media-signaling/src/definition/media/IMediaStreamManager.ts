import type { Emitter } from '@rocket.chat/emitter';

import type { IMediaStreamWrapper } from './IMediaStreamWrapper';

export type MediaStreamManagerEvents = {
	streamChanged: void;
};

export interface IMediaStreamManager {
	readonly emitter: Emitter<MediaStreamManagerEvents>;

	/** Microphone audio stream — the call's primary audio channel. */
	readonly microphoneLocal: IMediaStreamWrapper;

	readonly screenShareLocal: IMediaStreamWrapper;

	readonly microphoneRemote: IMediaStreamWrapper;

	readonly screenShareRemote: IMediaStreamWrapper;

	getStreams(): IMediaStreamWrapper[];
	getLocalStreams(): IMediaStreamWrapper[];
	getRemoteStreams(): IMediaStreamWrapper[];

	getLocalStreamByTag(tag: string): IMediaStreamWrapper | null;
	getRemoteStreamByTag(tag: string): IMediaStreamWrapper | null;

	hasAllRequiredTracks(): boolean;
}
