import type { IUser } from '@rocket.chat/core-typings';

export type AgentContractState = 'proposed' | 'signed' | 'ignored';

export type MinimalUserData = Pick<IUser, '_id' | 'name' | 'freeSwitchExtension'> & Pick<Required<IUser>, 'username'>;

export type SipUserData = {
	id: string;
	name?: string;
	username?: string;
};
