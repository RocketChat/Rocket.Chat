import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useAllCustomFields = () => {
	const allCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');

	return useQuery(['livechat/custom-fields'], async () => allCustomFields());
};
