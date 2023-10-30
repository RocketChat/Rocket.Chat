import type { IImportChannel } from './IImportChannel';
import type { IImportUser } from './IImportUser';

export interface IImportFileData {
	users: Array<IImportUser>;
	channels: Array<IImportChannel>;
	message_count: number;
}
