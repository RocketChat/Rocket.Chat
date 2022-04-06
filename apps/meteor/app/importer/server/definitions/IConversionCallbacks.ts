import type { IImportUser } from '@rocket.chat/core-typings';
import type { IImportMessage } from '@rocket.chat/core-typings';
import type { IImportChannel } from '@rocket.chat/core-typings';

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
