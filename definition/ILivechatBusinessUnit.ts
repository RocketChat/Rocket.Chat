export interface ILivechatBusinessUnit {
	_id: string;
	name: string;
	visibility: 'public' | 'private';
	type: string;
	numMonitors: number;
	numDepartments: number;
	_updatedAt: Date;
}
