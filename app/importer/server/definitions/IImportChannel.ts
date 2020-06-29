export interface IImportChannel {
	_id?: string;
	u?: {
		_id: string;
	};
	name?: string;
	users: Array<string>;
	importIds: Array<string>;
	t: string;
	topic?: string;
	description?: string;
	ts?: Date;
	archived?: boolean;
}
