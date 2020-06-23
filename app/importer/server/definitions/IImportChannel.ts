export interface IImportChannelIdentification {
	id: string;
	u?: {
		_id?: string;
		username?: string;
	};
	isGeneral?: boolean;
}

export interface IImportChannel {
	id?: string;
	u?: {
		_id?: string;
		username?: string;
	};
	name: string;
	users: Array<string>;
	userType?: 'username' | 'id' | 'importedId';
	t: string;
}
