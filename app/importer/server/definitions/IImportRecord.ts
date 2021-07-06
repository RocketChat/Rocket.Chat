import { IImportUser } from './IImportUser';
import { IImportChannel } from './IImportChannel';
import { IImportMessage } from './IImportMessage';

export interface IImportRecord {
	data: IImportUser | IImportChannel | IImportMessage;
	dataType: 'user' | 'channel' | 'message';
	_id: string;
	options?: {};
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
