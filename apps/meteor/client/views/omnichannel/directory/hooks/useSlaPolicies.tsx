import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { millisecondsToMinutes } from 'date-fns';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';

export const useSlaPolicies = () => {
	const isEnterprise = useHasLicenseModule('livechat-enterprise') === true;
	const getSlaPolicies = useEndpoint('GET', '/v1/livechat/sla');
	const { data: { sla } = {}, ...props } = useQuery({
		queryKey: ['/v1/livechat/sla'],
		queryFn: () => getSlaPolicies({}),
		staleTime: millisecondsToMinutes(10),
		enabled: isEnterprise,
	});

	return {
		data: sla,
		...props,
	};
};
