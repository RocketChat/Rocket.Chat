import { ILivechatDepartment, Serialized } from '@rocket.chat/core-typings';
import { EndpointFunction } from '@rocket.chat/ui-contexts';

export const normalizeDepartments = async (
	departments: Serialized<ILivechatDepartment[]>,
	selectedDepartment: string | (string & readonly string[]) | undefined,
	getDepartment: EndpointFunction<'GET', '/v1/livechat/department/:_id'>,
) => {
	if (selectedDepartment === 'all' || departments.find((department) => department._id === selectedDepartment)) {
		return departments;
	}

    const { department: missingDepartment } = await getDepartment({})

	return [...departments, missingDepartment];
};
