import type { IImportRecord } from '@rocket.chat/core-typings';

export type ImporterBeforeImportCallback = {
	(data: IImportRecord): Promise<boolean>;
};

export type ImporterAfterImportCallback = {
	(data: IImportRecord, isNewRecord: boolean): Promise<void>;
};

export interface IConversionCallbacks {
	beforeImportFn?: ImporterBeforeImportCallback;
	afterImportFn?: ImporterAfterImportCallback;
	onErrorFn?: () => Promise<void>;
	afterBatchFn?: (successCount: number, errorCount: number) => Promise<void>;
}
