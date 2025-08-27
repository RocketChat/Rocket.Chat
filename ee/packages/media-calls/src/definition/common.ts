import type { IUser, MediaCallActor, MediaCallActorType, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallService } from '@rocket.chat/media-signaling';

export type MinimalUserData = Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>;

export type GetActorContactOptions = {
	requiredType?: MediaCallActorType;
	preferredType?: MediaCallActorType;
};

export type InternalCallParams = {
	caller: MediaCallSignedActor;
	callee: MediaCallActor;
	requestedCallId?: string;
	requestedService?: CallService;
};
