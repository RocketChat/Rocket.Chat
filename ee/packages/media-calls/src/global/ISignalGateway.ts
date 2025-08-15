import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import type { ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';

import type { CreateCallParams } from '../providers/BaseMediaCallProvider';

export type ServerSignalTransport = (uid: IUser['_id'], signal: ServerMediaSignal) => void;

export interface ISignalGateway {
	createCall(params: CreateCallParams): Promise<IMediaCall>;
	setSignalHandler(handlerFn: ServerSignalTransport): void;
	receiveSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): void;
}
