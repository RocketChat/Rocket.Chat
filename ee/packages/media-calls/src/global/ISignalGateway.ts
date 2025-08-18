import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import type { ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';
import { CreateCallParams } from '../providers/IMediaCallProvider';

export type ServerSignalTransport = (uid: IUser['_id'], signal: ServerMediaSignal) => void;

export type SignalGatewayEvents = {
	callUpdated: string;
};

export interface ISignalGateway {
	emitter: Emitter<SignalGatewayEvents>;

	createCall(params: CreateCallParams): Promise<IMediaCall>;
	setSignalHandler(handlerFn: ServerSignalTransport): void;
	receiveSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): void;

	reactToCallUpdate(callId: string): void;
}
