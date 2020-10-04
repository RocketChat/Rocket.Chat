export interface ISubscription {
	_id: string;
	_updatedAt?: Date;
	rid: string;
	u: {
		_id: string;
	};
	roles?: string[];
	ls?: Date;
	alert?: boolean;
	tunread?: string[];
}
