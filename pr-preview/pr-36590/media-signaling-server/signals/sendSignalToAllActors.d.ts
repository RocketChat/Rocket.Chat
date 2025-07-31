import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { MediaSignalBodyAndType, MediaSignalType } from '@rocket.chat/media-signaling';
type SendSignalToAllActorsOptions = {
    onlyDefinedSessions?: boolean;
    targetedSignal?: boolean;
};
export declare function getAllActors(call: IMediaCall, options?: SendSignalToAllActorsOptions): Promise<MediaCallActor[]>;
export declare function sendSignalToAllActors<T extends MediaSignalType>(call: IMediaCall, signal: MediaSignalBodyAndType<T>, options?: SendSignalToAllActorsOptions): Promise<void>;
export {};
