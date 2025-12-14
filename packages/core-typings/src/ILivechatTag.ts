export interface ILivechatTag {
	_id: string;
	name: string;
	description?: string;
	numDepartments: number;
	departments: Array<string>;
}

export type FindTagsResult = {
	tags: ILivechatTag[];
	count: number;
	offset: number;
	total: number;
};
