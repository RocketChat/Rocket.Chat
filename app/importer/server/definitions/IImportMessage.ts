export type IImportedId = 'string';
// export interface IImportMessageIdentification {
// 	id?: string;
// 	rid?: string;
// 	// tmid?: string;
// 	u?: {
// 		_id?: string;
// 		username?: string;
// 	};
// }

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

export interface IImportMessage {
	_id?: IImportedId;

	rid: IImportedId;
	u: {
		_id: IImportedId;
		// username?: string;
	};

	msg: string;
	// emoji?: string;
	// avatarUrl?: string;
	// alias?: string;
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
	attachments?: Record<string, any>;

	url?: string;
	_importFile?: IImportPendingFile;
}
