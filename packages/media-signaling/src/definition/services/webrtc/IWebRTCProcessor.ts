import type { Emitter } from '@rocket.chat/emitter';

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

	createOffer(params: { iceRestart?: boolean }): Promise<{ sdp: RTCSessionDescriptionInit }>;
	createAnswer(params: { sdp: RTCSessionDescriptionInit }): Promise<{ sdp: RTCSessionDescriptionInit }>;
	setRemoteDescription(params: { sdp: RTCSessionDescriptionInit }): Promise<void>;

	getRemoteMediaStream(): MediaStream;
}

export type WebRTCProcessorConfig = {
	mediaStreamFactory: MediaStreamFactory;
	logger?: IMediaSignalLogger;
};

export type WebRTCProcessorFactory = (config: WebRTCProcessorConfig) => IWebRTCProcessor;
