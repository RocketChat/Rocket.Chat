import type { UsersInfoParamsGet } from '@rocket.chat/rest-typings';
import type { EndpointFunction } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export type UserInfoQueryData = Awaited<ReturnType<EndpointFunction<'GET', '/v1/users.info'>>>;
type UserInfoQueryOptions = {
	enabled?: boolean;
	select?: (data: UserInfoQueryData) => UserInfoQueryData;
	placeholderData?: <T>(previousData: T | undefined) => T | undefined;
};

// a hook using tanstack useQuery and useEndpoint that fetches user information from the `users.info` endpoint
export const useUserInfoQuery = (params: UsersInfoParamsGet, options: UserInfoQueryOptions = { placeholderData: keepPreviousData }) => {
	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	return useQuery({
		queryKey: ['users.info', params],
		queryFn: () => getUserInfo({ ...params }),
		...options,
	});
};
