import { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export const useUsers = (): UseQueryResult<OperationResult<'GET', '/v1/users.list'>> => {
	const user = useEndpoint('GET', '/v1/users.list');

	return useQuery(['user'], () => user({ query: '' }));
};
