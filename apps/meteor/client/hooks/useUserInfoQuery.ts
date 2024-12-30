import type { UsersInfoParamsGet } from '@rocket.chat/rest-typings';
import type { EndpointFunction } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export type UserInfoQueryData = Awaited<ReturnType<EndpointFunction<'GET', '/v1/users.info'>>>;
type UserInfoQueryOptions = {
	enabled?: boolean;
	keepPreviousData?: boolean;
	select?: (data: UserInfoQueryData) => UserInfoQueryData;
};

export const useUserInfoQuery = (params: UsersInfoParamsGet, options: UserInfoQueryOptions = { keepPreviousData: true }) => {
	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	return useQuery(['users.info', params], () => getUserInfo({ ...params }), options);
};
