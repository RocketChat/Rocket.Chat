import type { IUser } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';
export declare function processSignal(signal: MediaSignal, uid: IUser['_id']): Promise<void>;
