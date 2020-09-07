export interface IRoom {
	_id: string;
	prid: string;
	t: 'c' | 'p' | 'd' | 'l';
	_updatedAt?: Date;
	tokenpass?: {
		require: string;
		tokens: {
			token: string;
			balance: number;
		}[];
	};
}
