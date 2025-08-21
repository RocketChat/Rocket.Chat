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
	onCallAccepted(callId: string, signedContractId: string): Promise<void>;
	onCallActive(callId: string): Promise<void>;
	onCallCreated(call: IMediaCall): Promise<void>;
	onRemoteDescriptionChanged(callId: string, description: RTCSessionDescriptionInit): Promise<void>;

	getMyCallActor(call: IMediaCall): MediaCallActor;
}
