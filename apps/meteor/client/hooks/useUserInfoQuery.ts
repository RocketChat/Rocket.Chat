import type { UsersInfoParamsGet } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
// a hook using tanstack useQuery and useEndpoint that fetches user information from the `users.info` endpoint

export const useUserInfoQuery = (params: UsersInfoParamsGet) => {
	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const result = useQuery(['users.info', params], () => getUserInfo({ ...params }), {
		keepPreviousData: true,
	});

	return result;
};
