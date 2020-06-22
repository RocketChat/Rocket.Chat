export interface IImportMessageIdentification {
	id?: string;
	rid?: string;
	// tmid?: string;
	u?: {
		_id?: string;
		username?: string;
	};
}

export interface IImportMessageReaction {
	name: string;
	usernames: Array<string>;
}

export interface IImportMessage {
	id?: string;

	rid?: string;
	u?: {
		_id?: string;
		username?: string;
	};

	msg: string;
	// emoji?: string;
	// avatarUrl?: string;
	// alias?: string;
	ts: Date;
	// t: string;
	// reactions: Map<string, IImportMessageReaction>;
	// attachments: Record<string, any>;
	// editedAt?: Date;
	// editedBySourceId?: string;
	// groupable?: boolean;
}

// export interface IImportPendingFile {
// 	downloadUrl: string;
// 	id: string;
// 	size: number;
// 	name: string;
// 	external: boolean;
// 	source: string;
// 	original: Record<string, any>;
// }

// export interface IImportFileMessage extends IImportMessage {
// 	url?: string;
// 	_importFile: IImportPendingFile;
// }
