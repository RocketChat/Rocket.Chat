import type { WebRTCProcessorFactory } from './webrtc/IWebRTCProcessor';

export interface IServiceProcessorFactoryList {
	webrtc?: WebRTCProcessorFactory;
}
