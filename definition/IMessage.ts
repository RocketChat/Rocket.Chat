export interface IMessage {
	_id: string;
	rid: string;
	_updatedAt?: Date;
	_hidden?: boolean;
	imported?: boolean;
	mentions?: {
		_id: string;
		name?: string;
	}[];
	u: {
		_id: string;
		name?: string;
	};
}
