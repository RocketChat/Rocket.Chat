import type { IUser } from '@rocket.chat/core-typings';
import type { ClientMediaSignal } from '@rocket.chat/media-signaling';

export interface IMediaCallService {
	processSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): Promise<void>;
	processSerializedSignal(fromUid: IUser['_id'], signal: string): Promise<void>;
	hangupExpiredCalls(): Promise<void>;
}
