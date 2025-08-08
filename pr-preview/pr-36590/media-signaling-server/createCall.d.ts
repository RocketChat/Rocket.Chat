import type { IMediaCall, MediaCallActor, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallService } from '@rocket.chat/media-signaling';
type CreateCallParams = {
    caller: MediaCallSignedActor;
    callee: MediaCallActor;
    requestedCallId?: string;
    requestedService?: CallService;
};
export declare function createCall(params: CreateCallParams): Promise<IMediaCall>;
export {};
