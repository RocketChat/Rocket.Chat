import type { PexRTCProcessorFactory } from './pexip/IPexRTCProcessor';
import type { WebRTCProcessorFactory } from './webrtc/IWebRTCProcessor';

export interface IServiceProcessorFactoryList {
	webrtc?: WebRTCProcessorFactory;
	pexip?: PexRTCProcessorFactory;
}
