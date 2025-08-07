import type { IMediaCall } from '@rocket.chat/core-typings';
import type { ClientMediaSignal, CallRole } from '@rocket.chat/media-signaling';
import { UserBasicAgent, type MinimalUserData } from './BasicAgent';
import { UserAgentSignalProcessor } from './SignalProcessor';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
export declare class UserMediaCallAgent extends UserBasicAgent<IMediaCallAgent> implements IMediaCallAgent {
    readonly callId: string;
    readonly contractId: string;
    protected _signed: boolean;
    protected signalProcessor: UserAgentSignalProcessor;
    get signed(): boolean;
    constructor(user: MinimalUserData, data: {
        role: CallRole;
        callId: string;
        contractId: string;
        contractSigned?: boolean;
    });
    processSignal(signal: ClientMediaSignal, call: IMediaCall): Promise<void>;
    setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void>;
    getLocalDescription(): Promise<RTCSessionDescriptionInit | null>;
    requestOffer(params: {
        iceRestart?: boolean;
    }): Promise<void>;
}
