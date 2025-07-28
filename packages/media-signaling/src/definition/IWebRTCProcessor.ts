import type { DeliverParams } from './signal/MediaSignalDeliver';
import type { RequestParams } from './signal/MediaSignalRequest';

export interface IWebRTCProcessor {
	// Function used to create a webrtc offer using the pre-initialized peer connection
	createOffer(params: RequestParams<'offer'>): Promise<DeliverParams<'sdp'>>;
	// Function used to create a webrtc answer using the pre-initialized peer connection
	createAnswer(params: RequestParams<'answer'>): Promise<DeliverParams<'sdp'>>;
	// Function used to retrieve the local sdp from the peer connection
	collectLocalDescription(params: RequestParams<'sdp'>): Promise<DeliverParams<'sdp'>>;
	setRemoteDescription(params: DeliverParams<'sdp'>): Promise<void>;
	addIceCandidates(params: DeliverParams<'ice-candidates'>): Promise<void>;

	getRemoteMediaStream(): MediaStream;

	// // Function used to add a callback to be executed when an ice candidate is gathered
	// onIceCandidate(cb: unknown): void;
	// // Function used to add a callback to be executed when ICE needs to be restarted
	// onNegotiationNeeded(cb: unknown): void;
}

export type WebRTCProcessorFactory = () => IWebRTCProcessor;
