import type { UsersInfoParamsGet } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type UserInfoQueryOptions = {
	enabled?: boolean;
	keepPreviousData?: boolean;
};

// a hook using tanstack useQuery and useEndpoint that fetches user information from the `users.info` endpoint
export const useUserInfoQuery = (params: UsersInfoParamsGet, options: UserInfoQueryOptions = { keepPreviousData: true }) => {
	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	return useQuery(['users.info', params], () => getUserInfo({ ...params }), options);
};
