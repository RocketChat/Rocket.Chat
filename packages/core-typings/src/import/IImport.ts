import type { IRocketChatRecord } from '../IRocketChatRecord.js';
import type { IUser } from '../IUser.js';
import type { ProgressStep } from './IImportProgress.js';

export interface IImport extends IRocketChatRecord {
	type: string;
	importerKey: string;
	ts: Date;
	status: ProgressStep;
	valid: boolean;
	user: IUser['_id'];
	_updatedAt: Date;
	contentType?: string;
	file?: string;
	count?: {
		total?: number;
		completed?: number;
		error?: number;
		users?: number;
		messages?: number;
		channels?: number;
		contacts?: number;
	};
}
