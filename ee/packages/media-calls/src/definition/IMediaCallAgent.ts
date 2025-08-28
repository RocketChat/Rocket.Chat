import type { IMediaCall, MediaCallActor, MediaCallActorType } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';

export interface IMediaCallAgent {
	readonly actorType: MediaCallActorType;
	readonly actorId: string;
	readonly actor: MediaCallActor;
	readonly role: CallRole;
	readonly oppositeRole: CallRole;

	oppositeAgent: IMediaCallAgent | null;

	onCallEnded(callId: string): Promise<void>;
	/* Called when the call was accepted, even if the webrtc negotiation is pending */
	onCallAccepted(callId: string, signedContractId: string): Promise<void>;
	onCallActive(callId: string): Promise<void>;
	onCallCreated(call: IMediaCall): Promise<void>;
	/*
	 * Called when the sdp of the other actor is available AND the call has been accepted
	 * The server will automatically delay this event if the sdp becomes available before the call is accepted
	 */
	onRemoteDescriptionChanged(callId: string, description: RTCSessionDescriptionInit): Promise<void>;

	getMyCallActor(call: IMediaCall): MediaCallActor;
}
