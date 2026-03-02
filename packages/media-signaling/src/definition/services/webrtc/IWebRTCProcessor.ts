import type { Emitter } from '@rocket.chat/emitter';

import type { IClientMediaCall } from '../../call';
import type { IMediaSignalLogger } from '../../logger';
import type { IMediaStreamManager } from '../../media/IMediaStreamManager';
import type { MediaStreamIdentification } from '../../media/MediaStreamIdentification';
import type { IServiceProcessor, ServiceProcessorEvents } from '../IServiceProcessor';

export type WebRTCInternalStateMap = {
	signaling: RTCSignalingState;
	connection: RTCPeerConnectionState;
	iceConnection: RTCIceConnectionState;
	iceGathering: RTCIceGatheringState;
	iceUntrickler: 'waiting' | 'not-waiting' | 'timeout';
	remoteMute: boolean;
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

	readonly streams: IMediaStreamManager;

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

	setRemoteIds(streams: MediaStreamIdentification[]): void;
	getLocalStreamIds(): MediaStreamIdentification[];
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
