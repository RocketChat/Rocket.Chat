import { ILivechatDepartment } from '../../../../../../definition/ILivechatDepartment';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type LivechatDepartment = {
	GET: (params: {
		text: string;
		offset?: number;
		count?: number;
		sort?: string;
		onlyMyDepartments?: boolean;
	}) => {
		departments: ObjectFromApi<ILivechatDepartment>[];
		total: number;
	};
};
