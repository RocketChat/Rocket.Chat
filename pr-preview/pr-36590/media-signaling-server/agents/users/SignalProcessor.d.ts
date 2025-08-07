import type { IMediaCall } from '@rocket.chat/core-typings';
import type { ClientMediaSignal } from '@rocket.chat/media-signaling';
import type { UserMediaCallAgent } from './Agent';
export declare class UserAgentSignalProcessor {
    private readonly agent;
    constructor(agent: UserMediaCallAgent);
    processSignal(signal: ClientMediaSignal, call: IMediaCall): Promise<void>;
    private saveLocalDescription;
    private processAnswer;
    private processReject;
    private processACK;
    private requestChannelOffer;
}
