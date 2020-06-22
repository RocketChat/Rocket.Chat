export interface IImportChannelIdentification {
	id: string;
	u?: {
		_id?: string;
		username?: string;
	};
	is_general?: boolean;
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
