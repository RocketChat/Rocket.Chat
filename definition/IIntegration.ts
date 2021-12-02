import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';

export interface IIntegration extends IRocketChatRecord {
	type: string;
	enabled: boolean;
	channel: string;
	_createdBy: IUser;
}
