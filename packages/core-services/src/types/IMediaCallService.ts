import type { IMediaCall, IRoom, IUser } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';

export interface IMediaCallService {
	processSignal(signal: MediaSignal, fromUid: IUser['_id']): Promise<void>;
	createInternalCall(caller: { uid: IUser['_id']; sessionId: string }, callee: { uid: IUser['_id'] }): Promise<IMediaCall>;
	callRoom(caller: { uid: IUser['_id']; sessionId: string }, roomId: IRoom['_id']): Promise<IMediaCall>;
}
