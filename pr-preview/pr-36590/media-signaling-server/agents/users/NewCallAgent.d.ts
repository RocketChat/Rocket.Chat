import type { IMediaCall } from '@rocket.chat/core-typings';
import { UserBasicAgent } from './BasicAgent';
import type { IMediaCallBasicAgent, INewMediaCallAgent } from '../definition/IMediaCallAgent';
export declare class UserNewCallAgent extends UserBasicAgent implements INewMediaCallAgent {
    onNewCall(call: IMediaCall, otherAgent: IMediaCallBasicAgent): Promise<void>;
    private sendNewSignal;
}
