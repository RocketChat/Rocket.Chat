import { ILivechatDepartment } from '../../../../../../definition/ILivechatDepartment';

export type LivechatDepartmentSingleGetReturn = {
	department: ILivechatDepartment;
	success: boolean;
};

export type LivechatDepartmentSingle = {
	GET: () => LivechatDepartmentSingleGetReturn;
};
