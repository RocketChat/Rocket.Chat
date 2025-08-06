import type { IUser } from '@rocket.chat/core-typings';
import type { MediaSignal, ServerMediaSignal, ServerMediaSignalType } from '@rocket.chat/media-signaling';
export type SignalHandler = (uid: IUser['_id'], signal: ServerMediaSignal) => void;
export declare function setSignalHandler(handlerFn: SignalHandler): void;
export declare function sendSignal<T extends ServerMediaSignalType>(toUid: IUser['_id'], signal: MediaSignal<T>): Promise<void>;
