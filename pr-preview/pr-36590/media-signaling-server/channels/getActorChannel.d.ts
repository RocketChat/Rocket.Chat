import type { IMediaCall, IMediaCallChannel, MediaCallActor } from '@rocket.chat/core-typings';
export declare function getActorChannel(callId: IMediaCall['_id'], actor: MediaCallActor): Promise<IMediaCallChannel | null>;
