import type { IImportUser, IImportMessage, IImportChannel, IImportRecordType } from '@rocket.chat/core-typings';

type ImporterBeforeImportCallback = {
	(data: IImportUser | IImportChannel | IImportMessage, type: IImportRecordType): Promise<boolean>;
};

export type ImporterAfterImportCallback = {
	(data: IImportUser | IImportChannel | IImportMessage, type: IImportRecordType, isNewRecord: boolean): Promise<void>;
};

export interface IConversionCallbacks {
	beforeImportFn?: ImporterBeforeImportCallback;
	afterImportFn?: ImporterAfterImportCallback;
}
