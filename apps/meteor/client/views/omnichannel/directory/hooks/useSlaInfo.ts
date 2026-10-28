import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';

export const useSlaInfo = (slaId: string) => {
	const { data: isEnterprise = false } = useHasLicenseModule('livechat-enterprise');
	const getSLA = useEndpoint('GET', '/v1/livechat/sla/:slaId', { slaId });
	return useQuery({
		queryKey: ['/v1/livechat/sla/:slaId', slaId],
		queryFn: () => getSLA(),
		enabled: isEnterprise && !!slaId,
	});
};
