export interface IImportChannel {
	id?: string;
	importData: {
		id: string;
		u?: {
			_id?: string;
			username?: string;
		};
	};
	u?: {
		_id?: string;
		username?: string;
	};
	name: string;
	users: Array<string>;
	t: string;
}
