export interface IImportMessageReaction {
	name: string;
	users: Array<string>;
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

interface IImportAttachment extends Record<string, any> {
	text?: string;
	title?: string;
	fallback?: string;
}

export interface IImportMessage {
	_id?: string;

	rid: string;
	u: {
		_id: string;
	};

	msg: string;
	alias?: string;
	ts: Date;
	t?: string;
	reactions?: Record<string, IImportMessageReaction>;
	groupable?: boolean;

	tmid?: string;
	tlm?: Date;
	tcount?: number;
	replies?: Array<string>;
	editedAt?: Date;
	editedBy?: string;
	mentions?: Array<string>;
	channels?: Array<string>;
	attachments?: IImportAttachment[];
	bot?: boolean;
	emoji?: string;

	url?: string;
	_importFile?: IImportPendingFile;
}
