import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IFederationServer extends IRocketChatRecord {
	domain: string;
}

export type FederationKey = {
	type: 'private' | 'public';
	key: string;
};
