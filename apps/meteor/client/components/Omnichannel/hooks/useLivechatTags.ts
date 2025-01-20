import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useOmnichannel } from '../../../hooks/omnichannel/useOmnichannel';

type Props = {
	department?: string;
	text?: string;
	viewAll?: boolean;
};

export const useLivechatTags = (options: Props) => {
	const getTags = useEndpoint('GET', '/v1/livechat/tags');
	const { isEnterprise } = useOmnichannel();

	const { department, text, viewAll } = options;
	return useQuery({
		queryKey: ['/v1/livechat/tags', text, department],

		queryFn: () =>
			getTags({
				text: text || '',
				...(department && { department }),
				viewAll: viewAll ? 'true' : 'false',
			}),

		enabled: isEnterprise,
	});
};
