import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import { UserMediaCallAgent } from './Agent';
import { UserNewCallAgent } from './NewCallAgent';
import type { IMediaCallAgentFactory } from '../definition/IMediaCallAgent';
export interface IUserAgentFactory extends IMediaCallAgentFactory {
    getNewAgent(role: CallRole): UserNewCallAgent;
    getCallAgent(call: IMediaCall): UserMediaCallAgent | null;
}
export declare class UserAgentFactory {
    static getAgentFactoryForUser(userId: string, contractId?: string): Promise<IUserAgentFactory | null>;
    static getAgentFactoryForActor(actor: MediaCallActor): Promise<IUserAgentFactory | null>;
}
