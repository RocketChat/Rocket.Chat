import { IImportUser, IImportUserIdentification } from './IImportUser';
import { IImportChannel, IImportChannelIdentification } from './IImportChannel';
import { IImportMessage, IImportMessageIdentification } from './IImportMessage';

export interface IImportRecord {
	identification: IImportUserIdentification | IImportChannelIdentification | IImportMessageIdentification;
	data: IImportUser | IImportChannel | IImportMessage;
	dataType: 'user' | 'channel' | 'message';
	_id: string;
}

export interface IImportUserRecord extends IImportRecord {
	identification: IImportUserIdentification;
	data: IImportUser;
	dataType: 'user';
}

export interface IImportChannelRecord extends IImportRecord {
	identification: IImportChannelIdentification;
	data: IImportChannel;
	dataType: 'channel';
}

export interface IImportMessageRecord extends IImportRecord {
	identification: IImportMessageIdentification;
	data: IImportMessage;
	dataType: 'message';
}
