import type { IMediaCall, MediaCallActor, MediaCallSignedActor } from '@rocket.chat/core-typings';
export declare function createCall(caller: MediaCallSignedActor, callee: MediaCallActor): Promise<IMediaCall>;
