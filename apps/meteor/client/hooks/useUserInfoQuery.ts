import type { IUser, Serialized } from '@rocket.chat/core-typings';
import type { UsersInfoParamsGet } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

type UserInfoQueryOptions = {
	enabled?: boolean;
	placeholderData?: <T>(previousData: T | undefined) => T | undefined;
	select?: (data?: { user?: Partial<Serialized<IUser>> }) => unknown;
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
