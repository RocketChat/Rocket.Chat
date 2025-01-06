import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

// TODO: Unify this hook with all the other with the same proposal
export const useCustomFieldsQuery = () => {
	const getCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	return useQuery({ queryKey: ['/v1/livechat/custom-fields'], queryFn: async () => getCustomFields() });
};
