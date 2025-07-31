import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { MediaSignalBodyAndType, MediaSignalType } from '@rocket.chat/media-signaling';
export declare function sendSignalToActor<T extends MediaSignalType>(actor: MediaCallActor, signal: {
    callId: IMediaCall['_id'];
} & MediaSignalBodyAndType<T>): Promise<void>;
