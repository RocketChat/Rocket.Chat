import type { IMediaCall, IUser, MediaCallActor, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallService, ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';

export type CreateCallParams = {
	caller: MediaCallSignedActor;
	callee: MediaCallActor;
	requestedCallId?: string;
	requestedService?: CallService;
};

export type ServerSignalTransport = (uid: IUser['_id'], signal: ServerMediaSignal) => void;

export interface ISignalGateway {
	createCall(params: CreateCallParams): Promise<IMediaCall>;
	setSignalHandler(handlerFn: ServerSignalTransport): void;
	receiveSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): void;
}
