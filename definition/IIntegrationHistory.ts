export interface IIntegrationHistory {
	_id: string;
	type: string;
	step: string;
	integration: {
		_id: string;
	};
	event: string;
	_createdAt: Date;
	_updatedAt: Date;
	// "data" :
	ranPrepareScript: boolean;
	finished: boolean;
}
