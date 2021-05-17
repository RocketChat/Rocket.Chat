import { ILivechatDepartment } from '../../../../../../definition/ILivechatDepartment';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type LivechatDepartmentsByUnit = {
	GET: (params: {
		text: string;
		offset: number;
		count: number;
	}) => {
		files: ObjectFromApi<ILivechatDepartment>[];
		total: number;
	};
};
