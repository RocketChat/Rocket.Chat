import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useAllCustomFields = () => {
	const allCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');

	return useQuery(['livechat/custom-fields'], async () => allCustomFields());
};
