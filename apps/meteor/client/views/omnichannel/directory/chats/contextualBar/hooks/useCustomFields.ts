import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export const useCustomFields = (): UseQueryResult<{
	customFields: { _id: string; label: string }[];
}> => {
	const getCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	return useQuery(['livechat/custom-fields'], () => getCustomFields({ text: '' }));
};
