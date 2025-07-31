import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
export declare function createCall(caller: MediaCallActor, callee: MediaCallActor): Promise<IMediaCall>;
