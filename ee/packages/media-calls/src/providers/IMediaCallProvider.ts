import type { IMediaCall, MediaCallActor, MediaCallActorType, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallRole, CallService } from '@rocket.chat/media-signaling';

export interface IMediaCallProvider {
	providerName: string;
	supportedRoles: CallRole[];
	actorType: MediaCallActorType;
}

export type CreateCallParams = {
	caller: MediaCallSignedActor;
	callee: MediaCallActor;
	requestedCallId?: string;
	requestedService?: CallService;
};

export interface IOutgoingMediaCallProvider extends IMediaCallProvider {
	createCall(params: CreateCallParams): Promise<IMediaCall>;
}
