import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';

export const useSlaInfo = (slaId: string) => {
	const isEnterprise = useHasLicenseModule('livechat-enterprise') === true;
	const getSLA = useEndpoint('GET', '/v1/livechat/sla/:slaId', { slaId });
	return useQuery({
		queryKey: ['/v1/livechat/sla/:slaId', slaId],
		queryFn: () => getSLA(),
		enabled: isEnterprise && !!slaId,
	});
};
