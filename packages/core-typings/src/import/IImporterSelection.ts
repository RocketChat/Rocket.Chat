import type { IImporterSelectionChannel } from './IImporterSelectionChannel.js';
import type { IImporterSelectionContact } from './IImporterSelectionContact.js';
import type { IImporterSelectionUser } from './IImporterSelectionUser.js';

export interface IImporterSelection {
	name: string;
	users: IImporterSelectionUser[];
	channels: IImporterSelectionChannel[];
	contacts?: IImporterSelectionContact[];
	message_count: number;
}
