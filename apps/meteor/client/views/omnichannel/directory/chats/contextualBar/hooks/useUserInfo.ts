import { ISubscription, IUser } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export const useUserInfo = (
	username: string,
): UseQueryResult<{ user: IUser & { rooms?: Pick<ISubscription, 'rid' | 'name' | 't' | 'roles' | 'unread'>[] } }> => {
	const getUsersInfo = useEndpoint('GET', '/v1/users.info');

	return useQuery(['users.info', username], () => getUsersInfo({ username }));
};
