import type { Emitter } from '@rocket.chat/emitter';

import type { IClientMediaCall } from '../../call';
import type { IMediaSignalLogger } from '../../logger';
import type { IServiceProcessor, ServiceProcessorEvents } from '../IServiceProcessor';
import type { MediaStreamFactory } from '../MediaStreamFactory';

export type WebRTCInternalStateMap = {
	signaling: RTCSignalingState;
	connection: RTCPeerConnectionState;
	iceConnection: RTCIceConnectionState;
	iceGathering: RTCIceGatheringState;
	iceUntrickler: 'waiting' | 'not-waiting' | 'timeout';
};

export type WebRTCProcessorEvents = ServiceProcessorEvents<WebRTCInternalStateMap>;

export interface IWebRTCProcessor extends IServiceProcessor<WebRTCInternalStateMap> {
	emitter: Emitter<WebRTCProcessorEvents>;

	muted: boolean;
	held: boolean;

	setMuted(muted: boolean): void;
	setHeld(held: boolean): void;
	stop(): void;

	setInputTrack(newInputTrack: MediaStreamTrack | null): Promise<void>;
	createOffer(params: { negotiationId: string }): Promise<{ sdp: RTCSessionDescriptionInit; negotiationId: string }>;
	createAnswer(params: {
		sdp: RTCSessionDescriptionInit;
		negotiationId: string;
	}): Promise<{ sdp: RTCSessionDescriptionInit; negotiationId: string }>;
	setRemoteDescription(params: { sdp: RTCSessionDescriptionInit; negotiationId: string }): Promise<void>;

	getRemoteMediaStream(): MediaStream;
}

export type WebRTCProcessorConfig = {
	mediaStreamFactory?: MediaStreamFactory;
	call: IClientMediaCall;
	inputTrack: MediaStreamTrack | null;
	iceGatheringTimeout: number;
	logger?: IMediaSignalLogger;
	rtc?: RTCConfiguration;
};

export type WebRTCProcessorFactory = (config: WebRTCProcessorConfig) => IWebRTCProcessor;
