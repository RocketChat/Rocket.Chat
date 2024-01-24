import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type MembersExistsOptions = {
	rid: string;
	username: string;
	roomType: 'd' | 'p' | 'c';
	refresh?: boolean;
};

const endpointsByRoomType = {
	d: '/v1/im.memberExists',
	p: '/v1/groups.memberExists',
	c: '/v1/channels.memberExists',
} as const;

export const useMemberExists = (options: MembersExistsOptions) => {
	const checkMember = useEndpoint('GET', endpointsByRoomType[options.roomType]);

	return useQuery(['roomMembershipCheck', options.rid, options.username], () =>
		checkMember({ roomId: options.rid, username: options.username }),
	);
};
