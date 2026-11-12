import type { WebRTCProcessorFactory } from './webrtc/IWebRTCProcessor.js';

export interface IServiceProcessorFactoryList {
	webrtc?: WebRTCProcessorFactory;
}
