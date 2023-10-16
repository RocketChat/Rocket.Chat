import type { IImportChannel } from './IImportChannel';
import type { IImportMessage } from './IImportMessage';
import type { IImportUser } from './IImportUser';

export type IImportRecordType = 'user' | 'channel' | 'message';
export type IImportData = IImportUser | IImportChannel | IImportMessage;

export interface IImportRecord {
	data: IImportData;
	dataType: IImportRecordType;
	_id: string;
	options?: Record<string, any>;
	errors?: Array<{
		message: string;
		stack?: string;
	}>;
	skipped?: boolean;
}

export interface IImportUserRecord extends IImportRecord {
	data: IImportUser;
	dataType: 'user';
}

export interface IImportChannelRecord extends IImportRecord {
	data: IImportChannel;
	dataType: 'channel';
}

export interface IImportMessageRecord extends IImportRecord {
	data: IImportMessage;
	dataType: 'message';
	options: {
		useQuickInsert?: boolean;
	};
}
