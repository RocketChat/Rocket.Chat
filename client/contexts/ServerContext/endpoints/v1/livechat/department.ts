import { ILivechatDepartment } from '../../../../../../definition/ILivechatDepartment';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type LivechatDepartment = {
	GET: (params: {
		text: string;
		offset: number;
		count: number;
	}) => {
		departments: ObjectFromApi<ILivechatDepartment>[];
		total: number;
	};
};
