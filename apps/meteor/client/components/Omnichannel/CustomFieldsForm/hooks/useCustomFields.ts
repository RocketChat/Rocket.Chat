import type { OmnichannelCustomFieldEndpointPayload } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export const useCustomFields = (): UseQueryResult<{ customFields: OmnichannelCustomFieldEndpointPayload[] }, Error> => {
	const getCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	return useQuery(['livechat/custom-fields'], () => getCustomFields({ text: '' }));
};
