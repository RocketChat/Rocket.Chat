import type { IImportChannel } from './IImportChannel';
import type { IImportMessage } from './IImportMessage';
import type { IImportUser } from './IImportUser';

export interface IImportFileData {
	users: Array<IImportUser>;
	channels: Array<IImportChannel>;
	message_count: number;
	messages: Array<Pick<IImportMessage, '_id' | 'rid' | 'u'>>;
}
