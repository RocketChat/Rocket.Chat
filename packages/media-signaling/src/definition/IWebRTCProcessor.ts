import type { DeliverParams } from './MediaSignalDeliver';
import type { RequestParams } from './MediaSignalRequest';

export interface IWebRTCProcessor {
	// Called when the Session manager anticipates a webrtc call may be initiated
	initializePeerConnection(configuration?: RTCConfiguration): Promise<void>;
	// Function used to create a webrtc offer using the pre-initialized peer connection
	createOffer(params: RequestParams<'offer'>): Promise<DeliverParams<'sdp'>>;
	// Function used to create a webrtc answer using the pre-initialized peer connection
	createAnswer(params: RequestParams<'answer'>): Promise<DeliverParams<'sdp'>>;
	// Function used to retrieve the local sdp from the peer connection
	collectLocalDescription(params: RequestParams<'sdp'>): Promise<DeliverParams<'sdp'>>;

	// Function used to add a callback to be executed when an ice candidate is gathered
	onIceCandidate(cb: unknown): void;
	// Function used to add a callback to be executed when ICE needs to be restarted
	onNegotiationNeeded(cb: unknown): void;
}
