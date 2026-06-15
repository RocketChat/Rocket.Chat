import type { Emitter } from '@rocket.chat/emitter';

import type { IClientMediaCall } from '../../call';
import type { IMediaSignalLogger } from '../../logger';
import type { IMediaStreamManager } from '../../media/IMediaStreamManager';
import type { IServiceProcessor, ServiceProcessorEvents } from '../IServiceProcessor';

export type PexipConnectionState = 'disconnected' | 'connecting' | 'joining' | 'connected' | 'error';

export type PexRTCInternalStateMap = {
	connection: PexipConnectionState;
};

export type PexRTCUniqueEvents = {
	streamChanged: void;
};

export type PexRTCProcessorEvents = ServiceProcessorEvents<PexRTCInternalStateMap> & PexRTCUniqueEvents;

export interface IPexRTCProcessor extends IServiceProcessor<PexRTCInternalStateMap, PexRTCUniqueEvents> {
	emitter: Emitter<PexRTCProcessorEvents>;

	muted: boolean;
	held: boolean;
	setMuted(muted: boolean): void;
	setHeld(held: boolean): void;
	stop(): void;

	joinConference(): void;
	disconnect(): void;
	requestScreenShare(requested: boolean): void;

	readonly streams: IMediaStreamManager;

	// setInputTrack(newInputTrack: MediaStreamTrack | null): Promise<void>;
	// setScreenVideoTrack(newVideoTrack: MediaStreamTrack | null): Promise<void>;
}

export type PexRTCProcessorConfig = {
	call: IClientMediaCall;
	logger?: IMediaSignalLogger;
	nodeDomain: string;
	conferenceAlias: string;
	displayName: string;
	pin?: string;
};

export type PexRTCProcessorFactory = (config: PexRTCProcessorConfig) => Promise<IPexRTCProcessor>;
