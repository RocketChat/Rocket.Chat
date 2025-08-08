import type { IUser, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallContact, CallRole, ServerMediaSignal, CallNotification } from '@rocket.chat/media-signaling';
import type { IMediaCallBasicAgent, INewMediaCallAgent } from '../definition/IMediaCallAgent';
import { MediaCallBasicAgent } from '../definition/IMediaCallAgent';
export type MinimalUserData = Pick<IUser, '_id' | 'name' | 'freeSwitchExtension'> & Pick<Required<IUser>, 'username'>;
export declare class UserBasicAgent<T extends IMediaCallBasicAgent = INewMediaCallAgent> extends MediaCallBasicAgent<T> {
    protected readonly user: MinimalUserData;
    constructor(user: MinimalUserData, data: {
        role: CallRole;
        contractId?: string;
    });
    isRepresentingActor(actor: MediaCallActor): actor is MediaCallActor<'user'>;
    getContactInfo(): Promise<CallContact>;
    notify(callId: string, notification: CallNotification, signedContractId?: string): Promise<void>;
    protected sendSignal(signal: ServerMediaSignal): Promise<void>;
}
