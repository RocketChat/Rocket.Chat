import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';

export interface IImport extends IRocketChatRecord {
	type: string;
	importerKey: string;
	ts: Date;
	status: string;
	valid: boolean;
	user: IUser['_id'];
	_updatedAt: Date;
	contentType?: string;
	file?: string;
}
