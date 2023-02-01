import type { PaginatedAppRequests } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

export const useMarkRequestsAsSeen = (appRequests: PaginatedAppRequests['data'] | undefined, isSuccess: boolean) => {
	const markSeen = useEndpoint('POST', '/apps/app-request/markAsSeen');

	const markAppRequestsAsSeen = useMutation({
		mutationKey: ['mark-app-requests-as-seen'],
		mutationFn: (unseenRequests: Array<string>) => markSeen({ unseenRequests }),
	});

	const unseenRequests = useMemo(
		() => (isSuccess ? appRequests?.filter(({ id, seen }) => !seen && id).map(({ id }) => id) : []),
		[appRequests, isSuccess],
	);

	useEffect(() => markAppRequestsAsSeen.mutate(unseenRequests as string[]), [markAppRequestsAsSeen, unseenRequests]);
};
