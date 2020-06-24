export interface IImportChannelIdentification {
	id: string;
	u?: {
		_id?: string;
		username?: string;
	};
	isGeneral?: boolean;
}

export interface IImportChannel {
	_id?: string;
	u?: {
		_id?: string;
		username?: string;
	};
	name: string;
	users: Array<string>;
	userType?: 'rocket.chat' | 'imported';
	t: string;
}
