import { IImportUser } from './IImportUser';
import { IImportMessage } from './IImportMessage';
import { IImportChannel } from './IImportChannel';

export type ImporterBeforeImportCallback = {(data: IImportUser | IImportChannel | IImportMessage, type: string): boolean}
export type ImporterAfterImportCallback = {(data: IImportUser | IImportChannel | IImportMessage, type: string, isNewRecord: boolean): void};

export interface IConversionCallbacks {
	beforeImportFn?: ImporterBeforeImportCallback;
	afterImportFn?: ImporterAfterImportCallback;
}
