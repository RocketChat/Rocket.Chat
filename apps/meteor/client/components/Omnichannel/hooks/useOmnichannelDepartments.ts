import type { ILivechatDepartment, LivechatDepartmentProps } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useOmnichannelDepartments = (
	query?: LivechatDepartmentProps,
): { departments: ILivechatDepartment[] | []; refetch: () => void } => {
	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	const { data, refetch } = useQuery(['getDepartments', query], async () => getDepartments(query));

	return { data, refetch };
};
