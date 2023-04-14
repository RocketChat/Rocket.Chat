import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
// a hook using tanstack useQuery and useEndpoint that fetches user information from the `users.info` endpoint

export const useUserInfoQuery = (username: string) => {
	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const result = useQuery(['users.info', username], () => getUserInfo({ username }), {
		refetchOnWindowFocus: false,
		keepPreviousData: true,
	});

	return result;
};
