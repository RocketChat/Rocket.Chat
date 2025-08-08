import type { IMediaCall } from '@rocket.chat/core-typings';
import type { ClientMediaSignal, CallRole, CallNotification } from '@rocket.chat/media-signaling';
import { UserBasicAgent, type MinimalUserData } from './BasicAgent';
import { UserAgentSignalProcessor } from './SignalProcessor';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
import type { AgentContractState } from '../definition/common';
export declare class UserMediaCallAgent extends UserBasicAgent<IMediaCallAgent> implements IMediaCallAgent {
    readonly callId: string;
    readonly contractId: string;
    protected contractState: AgentContractState;
    protected signalProcessor: UserAgentSignalProcessor;
    get signed(): boolean;
    get ignored(): boolean;
    constructor(user: MinimalUserData, data: {
        role: CallRole;
        callId: string;
        contractId: string;
        contractState?: AgentContractState;
    });
    processSignal(signal: ClientMediaSignal, call: IMediaCall): Promise<void>;
    setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void>;
    getLocalDescription(): Promise<RTCSessionDescriptionInit | null>;
    requestOffer(params: {
        iceRestart?: boolean;
    }): Promise<void>;
    notify(callId: string, notification: CallNotification, signedContractId?: string): Promise<void>;
    sign(): Promise<void>;
}
