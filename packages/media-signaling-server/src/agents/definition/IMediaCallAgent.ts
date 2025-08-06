import type { IMediaCall, MediaCallActor, MediaCallActorType } from '@rocket.chat/core-typings';
import type { CallContact, CallRole, CallNotification } from '@rocket.chat/media-signaling';

// The basic agent may be instantiated to send notifications to actors with no need for a contract
export interface IMediaCallBasicAgent {
	readonly actorType: MediaCallActorType;
	readonly actorId: string;
	// on new calls, contractId will only be defined for the caller;
	// the callee only has a contractId when the agent is instantiated for a specific contract or when a callee contract is signed.
	readonly contractId?: string;
	readonly role: CallRole;
	readonly oppositeRole: CallRole;

	isRepresentingActor(actor: MediaCallActor): boolean;
	getContactInfo(): Promise<CallContact>;
	notify(callId: string, notification: CallNotification): Promise<void>;
}

// The New Call Agent may be instantiated without a call; it is used to start new calls
export interface INewMediaCallAgent extends IMediaCallBasicAgent {
	onNewCall(call: IMediaCall, otherAgent: IMediaCallBasicAgent): Promise<void>;
}

// The full agent will always be instantiated for a specific call and contract; it is used to manage the call state
export interface IMediaCallAgent extends IMediaCallBasicAgent {
	readonly callId: string;
	readonly contractId: string;
	readonly signed: boolean;

	readonly actor: Required<MediaCallActor>;

	setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void>;
	getLocalDescription(): Promise<RTCSessionDescriptionInit | null>;
	requestOffer(params: { iceRestart?: boolean }): Promise<void>;
}

// The agent factory is an object with functions to instantiate the two agent types
export interface IMediaCallAgentFactory {
	// getNewAgent may never return null; if the agent can't handle a call, the whole factory should be null instead.
	getNewAgent(role: CallRole): INewMediaCallAgent;
	// getCallAgent may return null if the actor is not part of the call, if it doesn't have a contract, or if a different contract is already signed
	getCallAgent(call: IMediaCall): IMediaCallAgent | null;
}

export abstract class MediaCallBasicAgent<T extends IMediaCallBasicAgent = IMediaCallBasicAgent> implements IMediaCallBasicAgent {
	public readonly actorType: T['actorType'];

	public readonly actorId: T['actorId'];

	public readonly contractId: T['contractId'];

	public readonly role: T['role'];

	public get actor(): { type: T['actorType']; id: T['actorId']; contractId: T['contractId'] } {
		return {
			type: 'user',
			id: this.actorId,
			contractId: this.contractId,
		};
	}

	public get oppositeRole(): T['oppositeRole'] {
		return ({ callee: 'caller', caller: 'callee' } as const)[this.role];
	}

	constructor(data: MediaCallActor & { role: CallRole }) {
		this.actorType = data.type;
		this.actorId = data.id;
		this.role = data.role;
		this.contractId = data.contractId;
	}

	public isRepresentingActor(actor: MediaCallActor): boolean {
		return actor.type === this.actorType && actor.id === this.actorId;
	}

	public isRepresentingContract(actor: MediaCallActor, contractId: string): boolean {
		return this.isRepresentingActor(actor) && this.contractId === contractId;
	}

	public abstract getContactInfo(): Promise<CallContact>;

	public abstract notify(callId: string, notification: CallNotification): Promise<void>;
}
