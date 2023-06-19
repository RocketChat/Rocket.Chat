import type { IImportUser, IImportMessage, IImportChannel } from '@rocket.chat/core-typings';

type ImporterBeforeImportCallback = {
	(data: IImportUser | IImportChannel | IImportMessage, type: string): Promise<boolean>;
};

export type ImporterAfterImportCallback = {
	(data: IImportUser | IImportChannel | IImportMessage, type: string, isNewRecord: boolean): Promise<void>;
};

export interface IConversionCallbacks {
	beforeImportFn?: ImporterBeforeImportCallback;
	afterImportFn?: ImporterAfterImportCallback;
}
