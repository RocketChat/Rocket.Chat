import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMediaSignal } from '@rocket.chat/media-signaling';
export type SignalHandler = (uid: IUser['_id'], signal: ServerMediaSignal) => void;
export declare function setSignalHandler(handlerFn: SignalHandler): void;
export declare function sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): Promise<void>;
