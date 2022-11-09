import { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export const useAllCustomFields = (): UseQueryResult<OperationResult<'GET', '/v1/livechat/custom-fields'>> => {
	const allCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');

	return useQuery(['livechat/custom-fields'], async () => allCustomFields());
};
