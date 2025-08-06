import type { IMediaCall, IMediaCallChannel, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallHangupReason, CallRole } from '@rocket.chat/media-signaling';
import type { IMediaCallAgent, IMediaCallAgentFactory, IMediaCallBasicAgent, INewMediaCallAgent } from './definition/IMediaCallAgent';
declare class MediaCallAgentManager {
    getAgentFactoryForActor(actor: MediaCallActor): Promise<IMediaCallAgentFactory | null>;
    getNewAgentForActor(actor: MediaCallActor, role: CallRole): Promise<INewMediaCallAgent | null>;
    getAgentForCallActor(call: IMediaCall, actor: MediaCallActor): Promise<IMediaCallAgent | null>;
    getRoleForCallActor(call: IMediaCall, actor: Pick<MediaCallActor, 'type' | 'id'>): CallRole | null;
    getOrCreateContract(callId: string, agent: IMediaCallBasicAgent, params?: Pick<IMediaCallChannel, 'acknowledged'>): Promise<IMediaCallChannel>;
    hangupCall(agent: IMediaCallAgent, reason: CallHangupReason): Promise<void>;
    acknowledgeCallee(agent: IMediaCallAgent): Promise<void>;
    acceptCall(agent: IMediaCallAgent): Promise<void>;
    setLocalDescription(agent: IMediaCallAgent, sdp: RTCSessionDescriptionInit): Promise<void>;
    private getOppositeAgentFactory;
    private getOppositeAgent;
    private getAnyOppositeAgent;
    private hangupByServer;
    private hangupAndThrow;
    private shieldPromise;
    private notifyAll;
    private processAcceptedCall;
    private getNewAgent;
    private getCallAgent;
}
export declare const agentManager: MediaCallAgentManager;
export {};
