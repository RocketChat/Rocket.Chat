export type IImportedId = 'string';

export interface IImportMessageReaction {
	name: string;
	users: Array<IImportedId>;
}

export interface IImportPendingFile {
	downloadUrl: string;
	id: string;
	size: number;
	name: string;
	external: boolean;
	source: string;
	original: Record<string, any>;
}

export interface IImportAttachment extends Record<string, any> {
	text: string;
	title: string;
	fallback: string;
}

export interface IImportMessage {
	_id?: IImportedId;

	rid: IImportedId;
	u: {
		_id: IImportedId;
	};

	msg: string;
	alias?: string;
	ts: Date;
	t?: string;
	reactions?: Record<string, IImportMessageReaction>;
	groupable?: boolean;

	tmid?: IImportedId;
	tlm?: Date;
	tcount?: number;
	replies?: Array<IImportedId>;
	editedAt?: Date;
	editedBy?: IImportedId;
	mentions?: Array<IImportedId>;
	channels?: Array<string>;
	attachments?: IImportAttachment;
	bot?: boolean;
	emoji?: string;

	url?: string;
	_importFile?: IImportPendingFile;
}
