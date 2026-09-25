import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { ABACQueryKeys } from '../../../lib/queryKeys';

export const useAbacMembershipPreview = (members: string[], attributes: Record<string, string[]>, enabled = true) => {
	const previewMembership = useEndpoint('POST', '/v1/abac/membership-preview');

	return useQuery({
		queryKey: ABACQueryKeys.membershipPreview(members, attributes),
		queryFn: () => previewMembership({ members, attributes }),
		enabled: enabled && Object.keys(attributes).length > 0,
		refetchOnWindowFocus: false,
	});
};
