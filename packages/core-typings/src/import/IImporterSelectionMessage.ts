import type { IImportedId } from './IImportMessage';

export interface IImporterSelectionMessage {
	_id?: IImportedId;
	rid: IImportedId;
	u: IImportedId;
}
