import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
export declare function getChannelByCallIdAndRole<T extends 'caller' | 'callee'>(callId: IMediaCall['_id'], role: T): Promise<IMediaCallChannel | null>;
