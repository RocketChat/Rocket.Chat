import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useSlaInfo = (slaId: string) => {
	const getSLA = useEndpoint('GET', `/v1/livechat/sla/${slaId}`);
	return useQuery(['/v1/livechat/sla/', slaId], () => getSLA());
};
