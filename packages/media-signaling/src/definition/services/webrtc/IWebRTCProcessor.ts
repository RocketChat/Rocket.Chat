import type { Emitter } from '@rocket.chat/emitter';

import type { MediaStreamManager } from '../../../lib/media/MediaStreamManager';
import type { IClientMediaCall } from '../../call';
import type { IMediaSignalLogger } from '../../logger';
import type { IServiceProcessor, ServiceProcessorEvents } from '../IServiceProcessor';

export type WebRTCInternalStateMap = {
	signaling: RTCSignalingState;
	connection: RTCPeerConnectionState;
	iceConnection: RTCIceConnectionState;
	iceGathering: RTCIceGatheringState;
	iceUntrickler: 'waiting' | 'not-waiting' | 'timeout';
	remoteMute: boolean;
	remoteScreenShare: boolean;
};

export type WebRTCUniqueEvents = {
	negotiationNeeded: void;
	streamChanged: void;
};

export type WebRTCProcessorEvents = ServiceProcessorEvents<WebRTCInternalStateMap> & WebRTCUniqueEvents;

export interface IWebRTCProcessor extends IServiceProcessor<WebRTCInternalStateMap, WebRTCUniqueEvents> {
	emitter: Emitter<WebRTCProcessorEvents>;

	muted: boolean;
	held: boolean;
	setMuted(muted: boolean): void;
	setHeld(held: boolean): void;
	stop(): void;

	// TODO: use an interface
	readonly streams: MediaStreamManager;

	setInputTrack(newInputTrack: MediaStreamTrack | null): Promise<void>;
	setVideoTrack(newVideoTrack: MediaStreamTrack | null): Promise<void>;
	createOffer(params: { iceRestart?: boolean }): Promise<RTCSessionDescriptionInit>;
	createAnswer(): Promise<RTCSessionDescriptionInit>;

	setLocalDescription(sdp: RTCSessionDescriptionInit): Promise<void>;
	setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void>;
	waitForIceGathering(): Promise<void>;
	getLocalDescription(): RTCSessionDescriptionInit | null;

	audioLevel: number;
	localAudioLevel: number;

	getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport | null>;
	isRemoteHeld(): boolean;
	isRemoteMute(): boolean;
	isReceivingScreenShare(): boolean;
}

export type WebRTCProcessorConfig = {
	call: IClientMediaCall;
	inputTrack: MediaStreamTrack | null;
	videoTrack?: MediaStreamTrack | null;
	iceGatheringTimeout: number;
	logger?: IMediaSignalLogger;
	rtc?: RTCConfiguration;
};

export type WebRTCProcessorFactory = (config: WebRTCProcessorConfig) => IWebRTCProcessor;
