import type { IUser, MediaCallActorType } from '@rocket.chat/core-typings';

export type AgentContractState = 'proposed' | 'signed' | 'ignored';

export type MinimalUserData = Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>;

export type SipUserData = {
	id: string;
	name?: string;
	username?: string;
};

export type GetActorContactOptions = {
	requiredType?: MediaCallActorType;
	preferredType?: MediaCallActorType;
};
