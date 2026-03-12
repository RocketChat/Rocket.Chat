import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import type { ClientMediaSignal, ClientMediaSignalAnswer } from '@rocket.chat/media-signaling';

export interface IMediaCallService {
	answerCall(uid: IUser['_id'], params: Omit<ClientMediaSignalAnswer, 'type'>): Promise<IMediaCall>;
	processSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): Promise<void>;
	processSerializedSignal(fromUid: IUser['_id'], signal: string): Promise<void>;
	hangupExpiredCalls(): Promise<void>;
}
