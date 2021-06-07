import { createContext, useContext } from 'react';

import { ILivechatDepartment } from '../../../definition/ILivechatDepartment';

export type OmnichannelDepartmentContextValue = {
	departments: ILivechatDepartment[];
};

export const OmnichannelDepartmentContext = createContext<OmnichannelDepartmentContextValue>({
	departments: [],
});

export const useOmnichannelDepartments = (): OmnichannelDepartmentContextValue['departments'] =>
	useContext(OmnichannelDepartmentContext).departments;
