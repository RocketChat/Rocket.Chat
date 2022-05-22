export interface IOmnichannelBusinessUnit {
	_id: string;
	name: string;
	visibility: 'public' | 'private';
	type: string;
	numMonitors: number;
	numDepartments: number;
	_updatedAt: Date;
}
