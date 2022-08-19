import { ILivechatDepartment, ILivechatDepartmentRecord } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export const useDepartment = (
	departmentId: ILivechatDepartment['_id'],
): UseQueryResult<{
	department: ILivechatDepartmentRecord | null;
}> => {
	const getDepartment = useEndpoint('GET', `/v1/livechat/department/${departmentId}`);
	return useQuery(['livechat/department', departmentId], () => getDepartment({}));
};
