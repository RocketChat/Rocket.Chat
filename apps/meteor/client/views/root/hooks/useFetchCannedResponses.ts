import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useCanAccessCannedResponses } from './useCanAccessCannedResponses';
import { CannedResponse } from '../../../../app/canned-responses/client/collections/CannedResponse';

export const useFetchCannedResponses = () => {
	const getCannedResponses = useEndpoint('GET', '/v1/canned-responses.get');
	const isEnabled = useCanAccessCannedResponses();

	const handleCannedResponses = async () => {
		const { responses } = await getCannedResponses();
		responses.forEach((response) => CannedResponse.insert(response));
		return responses;
	};

	return useQuery({
		queryKey: ['canned-responses'],
		queryFn: handleCannedResponses,
		enabled: isEnabled,
	});
};
