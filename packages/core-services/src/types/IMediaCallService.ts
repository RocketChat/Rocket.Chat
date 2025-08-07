import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import type { ClientMediaSignal } from '@rocket.chat/media-signaling';

export interface IMediaCallService {
	processSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): Promise<void>;
	createInternalCall(caller: { uid: IUser['_id']; contractId: string }, callee: { uid: IUser['_id'] }): Promise<IMediaCall>;
	callExtension(caller: { uid: IUser['_id']; contractId: string }, extension: string): Promise<IMediaCall>;
	callUser(caller: { uid: IUser['_id']; contractId: string }, userId: IUser['_id']): Promise<IMediaCall>;
	hangupEveryCall(hangupReason?: string): Promise<void>;
}
