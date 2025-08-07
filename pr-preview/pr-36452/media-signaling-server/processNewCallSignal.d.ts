import type { IUser } from '@rocket.chat/core-typings';
import type { ClientMediaSignalRequestCall } from '@rocket.chat/media-signaling';
export declare function processNewCallSignal(signal: ClientMediaSignalRequestCall, uid: IUser['_id']): Promise<void>;
