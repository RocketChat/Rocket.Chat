import type { IImporterSelectionChannel } from './IImporterSelectionChannel';
import type { IImporterSelectionContactOrIdentifier } from './IImporterSelectionContact';
import type { IImporterSelectionUser } from './IImporterSelectionUser';

export interface IImporterSelection<WithData extends boolean = true> {
	name: string;
	users: IImporterSelectionUser[];
	channels: IImporterSelectionChannel[];
	contacts?: IImporterSelectionContactOrIdentifier<WithData>[];
	message_count: number;
}
