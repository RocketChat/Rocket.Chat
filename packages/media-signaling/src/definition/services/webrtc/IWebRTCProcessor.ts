import type { Emitter } from '@rocket.chat/emitter';

import type { IClientMediaCall } from '../../call';
import type { IMediaSignalLogger } from '../../logger';
import type { IServiceProcessor, ServiceProcessorEvents } from '../IServiceProcessor';

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
	startNewNegotiation(): void;
	createOffer(params: { iceRestart?: boolean }): Promise<{ sdp: RTCSessionDescriptionInit }>;
	createAnswer(params: { sdp: RTCSessionDescriptionInit }): Promise<{ sdp: RTCSessionDescriptionInit }>;
	setRemoteAnswer(params: { sdp: RTCSessionDescriptionInit }): Promise<void>;

	getRemoteMediaStream(): MediaStream;

	audioLevel: number;
	localAudioLevel: number;

	getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport | null>;
}

export type WebRTCProcessorConfig = {
	call: IClientMediaCall;
	inputTrack: MediaStreamTrack | null;
	iceGatheringTimeout: number;
	logger?: IMediaSignalLogger;
	rtc?: RTCConfiguration;
};

export type WebRTCProcessorFactory = (config: WebRTCProcessorConfig) => IWebRTCProcessor;
