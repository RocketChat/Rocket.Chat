import type { IImporterSelectionChannel } from './IImporterSelectionChannel';
import type { IImporterSelectionUser } from './IImporterSelectionUser';

export interface IImporterSelection {
	name: string;
	users: IImporterSelectionUser[];
	channels: IImporterSelectionChannel[];
	message_count: number;
}
