import { useQuery } from '@tanstack/react-query';

import { omnichannelQueryKeys } from '../../../../lib/queryKeys';
import { useCustomFieldsQuery } from '../../hooks/useCustomFieldsQuery';
import { formatCustomFieldsMetadata } from '../utils/formatCustomFieldsMetadata';

type UseCustomFieldsMetadataOptions = {
	enabled?: boolean;
	scope: 'visitor' | 'room';
};

export const useCustomFieldsMetadata = ({ enabled = true, scope }: UseCustomFieldsMetadataOptions) => {
	const { data, isSuccess } = useCustomFieldsQuery();
	return useQuery({
		queryKey: omnichannelQueryKeys.livechat.customFieldsMetadata(scope),
		queryFn: async () => formatCustomFieldsMetadata(data?.customFields, scope),
		enabled: enabled && isSuccess,
	});
};
