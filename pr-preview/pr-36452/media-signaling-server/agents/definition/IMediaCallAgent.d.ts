import type { IMediaCall, MediaCallActor, MediaCallActorType, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallContact, CallRole, CallNotification } from '@rocket.chat/media-signaling';
export interface IMediaCallBasicAgent {
    readonly actorType: MediaCallActorType;
    readonly actorId: string;
    readonly contractId?: string;
    readonly role: CallRole;
    readonly oppositeRole: CallRole;
    isRepresentingActor(actor: MediaCallActor): boolean;
    getContactInfo(): Promise<CallContact>;
    notify(callId: string, notification: CallNotification): Promise<void>;
}
export interface INewMediaCallAgent extends IMediaCallBasicAgent {
    onNewCall(call: IMediaCall, otherAgent: IMediaCallBasicAgent): Promise<void>;
}
export interface IMediaCallAgent extends IMediaCallBasicAgent {
    readonly callId: string;
    readonly contractId: string;
    readonly signed: boolean;
    readonly actor: MediaCallSignedActor;
    setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void>;
    getLocalDescription(): Promise<RTCSessionDescriptionInit | null>;
    requestOffer(params: {
        iceRestart?: boolean;
    }): Promise<void>;
}
export interface IMediaCallAgentFactory {
    getNewAgent(role: CallRole): INewMediaCallAgent;
    getCallAgent(call: IMediaCall): IMediaCallAgent | null;
}
export declare abstract class MediaCallBasicAgent<T extends IMediaCallBasicAgent = IMediaCallBasicAgent> implements IMediaCallBasicAgent {
    readonly actorType: T['actorType'];
    readonly actorId: T['actorId'];
    readonly contractId: T['contractId'];
    readonly role: CallRole;
    get actor(): {
        type: T['actorType'];
        id: T['actorId'];
        contractId: T['contractId'];
    };
    get oppositeRole(): CallRole;
    constructor(data: MediaCallActor & {
        role: CallRole;
    });
    isRepresentingActor(actor: MediaCallActor): boolean;
    isRepresentingContract(actor: MediaCallActor, contractId: string): boolean;
    abstract getContactInfo(): Promise<CallContact>;
    abstract notify(callId: string, notification: CallNotification): Promise<void>;
}
