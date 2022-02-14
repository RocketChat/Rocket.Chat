import { IImportUser } from '../../../../definition/IImportUser';
import { IImportMessage } from '../../../../definition/IImportMessage';
import { IImportChannel } from '../../../../definition/IImportChannel';

export type ImporterBeforeImportCallback = {
	(data: IImportUser | IImportChannel | IImportMessage, type: string): boolean;
};
export type ImporterAfterImportCallback = {
	(data: IImportUser | IImportChannel | IImportMessage, type: string, isNewRecord: boolean): void;
};

export interface IConversionCallbacks {
	beforeImportFn?: ImporterBeforeImportCallback;
	afterImportFn?: ImporterAfterImportCallback;
}
