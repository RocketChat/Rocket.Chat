import type { Emitter } from '@rocket.chat/emitter';

import type { IMediaStreamWrapper } from './IMediaStreamWrapper';

export type MediaStreamManagerEvents = {
	streamChanged: void;
};

export interface IMediaStreamManager {
	readonly emitter: Emitter<MediaStreamManagerEvents>;

	readonly mainLocal: IMediaStreamWrapper;

	readonly mainRemote: IMediaStreamWrapper;

	getStreams(): IMediaStreamWrapper[];
	getLocalStreams(): IMediaStreamWrapper[];
	getRemoteStreams(): IMediaStreamWrapper[];

	getLocalStreamByTag(tag: string): IMediaStreamWrapper | null;
	getRemoteStreamByTag(tag: string): IMediaStreamWrapper | null;
}
