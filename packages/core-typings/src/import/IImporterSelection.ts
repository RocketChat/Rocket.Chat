import type { IImporterSelectionChannel } from './IImporterSelectionChannel';
import type { IImporterSelectionContact } from './IImporterSelectionContact';
import type { IImporterSelectionUser } from './IImporterSelectionUser';

export interface IImporterSelection {
	name: string;
	users: IImporterSelectionUser[];
	channels: IImporterSelectionChannel[];
	contacts?: IImporterSelectionContact[];
	message_count: number;
}
