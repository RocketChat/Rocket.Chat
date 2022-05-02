import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IIntegration extends IRocketChatRecord {
	type: string;
	enabled: boolean;
	channel: string;
	scriptEnabled: boolean;
	_createdBy: IUser;
}
