import type { MediaStreamFactory } from './MediaStreamFactory';

export interface IWebRTCProcessor {
	createOffer(params: { iceRestart?: boolean }): Promise<{ sdp: RTCSessionDescriptionInit }>;
	createAnswer(params: { sdp: RTCSessionDescriptionInit }): Promise<{ sdp: RTCSessionDescriptionInit }>;
	setRemoteDescription(params: { sdp: RTCSessionDescriptionInit }): Promise<void>;

	getRemoteMediaStream(): MediaStream;
}

export type WebRTCProcessorConfig = {
	mediaStreamFactory: MediaStreamFactory;
};

export type WebRTCProcessorFactory = (config: WebRTCProcessorConfig) => IWebRTCProcessor;
