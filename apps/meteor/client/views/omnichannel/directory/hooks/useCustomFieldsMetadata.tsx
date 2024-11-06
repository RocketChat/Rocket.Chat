import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { formatCustomFieldsMetadata } from '../utils/formatCustomFieldsMetadata';

type UseCustomFieldsMetadataOptions = {
	enabled?: boolean;
	scope: 'visitor' | 'room';
};

export const useCustomFieldsMetadata = ({ enabled = true, scope }: UseCustomFieldsMetadataOptions) => {
	const getCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	return useQuery({
		queryKey: ['/v1/livechat/custom-fields', scope],

		queryFn: async () => {
			const { customFields } = (await getCustomFields()) ?? {};
			return formatCustomFieldsMetadata(customFields, scope);
		},

		enabled,
	});
};
