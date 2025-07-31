import type { MediaSignalRequestOffer, MediaSignalSDP } from './MediaSignal';
import type { MediaStreamFactory } from './MediaStreamFactory';

export interface IWebRTCProcessor {
	createOffer(params: MediaSignalRequestOffer): Promise<MediaSignalSDP>;
	createAnswer(params: MediaSignalSDP): Promise<MediaSignalSDP>;
	setRemoteDescription(params: MediaSignalSDP): Promise<void>;

	getRemoteMediaStream(): MediaStream;
}

export type WebRTCProcessorConfig = {
	mediaStreamFactory: MediaStreamFactory;
};

export type WebRTCProcessorFactory = (config: WebRTCProcessorConfig) => IWebRTCProcessor;
