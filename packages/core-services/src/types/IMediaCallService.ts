import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';

export interface IMediaCallService {
	processSignal(signal: MediaSignal, fromUid: IUser['_id']): Promise<void>;
	createInternalCall(caller: { uid: IUser['_id']; contractId: string }, callee: { uid: IUser['_id'] }): Promise<IMediaCall>;
	callExtension(caller: { uid: IUser['_id']; contractId: string }, extension: string): Promise<IMediaCall>;
	callUser(caller: { uid: IUser['_id']; contractId: string }, userId: IUser['_id']): Promise<IMediaCall>;
}
