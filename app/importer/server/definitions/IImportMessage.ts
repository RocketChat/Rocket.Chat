export type IImportedId = string;

// export interface IImportMessageIdentification {
// 	id?: IImportedId;
// 	rid?: IImportedId;
// 	// tmid?: string;
// 	u?: {
// 		_id?: IImportedId;
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
	_id?: string;

	rid: string;
	u: {
		_id: string;
		// username?: string;
	};

	msg: string;
	// emoji?: string;
	// avatarUrl?: string;
	// alias?: string;
	ts: Date;
	t?: string;
	reactions?: Map<string, IImportMessageReaction>;
	replies?: Array<IImportedId>;
	attachments?: Record<string, any>;
	editedAt?: Date;
	editedBy?: IImportedId;
	mentions?: Array<IImportedId>;
	channels?: Array<string>;
	groupable?: boolean;

	url?: string;
	_importFile?: IImportPendingFile;
}
