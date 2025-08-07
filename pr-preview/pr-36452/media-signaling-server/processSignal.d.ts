import type { IUser } from '@rocket.chat/core-typings';
import type { ClientMediaSignal } from '@rocket.chat/media-signaling';
export declare function processSignal(signal: ClientMediaSignal, uid: IUser['_id']): Promise<void>;
