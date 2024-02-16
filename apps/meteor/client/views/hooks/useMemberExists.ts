import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type MembersExistsOptions = {
	rid: string;
	username: string;
	refresh?: boolean;
};

export const useMemberExists = (options: MembersExistsOptions) => {
	const checkMember = useEndpoint('GET', '/v1/subscriptions.exists');

	return useQuery(['subscriptions/exists', options.rid, options.username], () =>
		checkMember({ roomId: options.rid, username: options.username }),
	);
};
