import type { IImportChannel } from './IImportChannel';
import type { IImportMessage } from './IImportMessage';
import type { IImportUser } from './IImportUser';

export interface IImportFileData {
	users: Array<IImportUser>;
	channels: Array<IImportChannel>;
	messages: Array<Pick<IImportMessage, '_id' | 'rid' | 'u'>>;
	message_count: number;
}
