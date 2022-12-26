import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { formatCustomFieldsMetadata } from '../utils/formatCustomFieldsMetadata';

export const useCustomFieldsMetadata = ({ enabled = true } = {}) => {
	const getCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	const { data = {}, ...props } = useQuery(
		['/v1/livechat/custom-fields'],
		async () => {
			const rawFields = await getCustomFields();
			return formatCustomFieldsMetadata(rawFields?.customFields);
		},
		{ enabled },
	);

	return {
		data,
		...props,
	};
};
