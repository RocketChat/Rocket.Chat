import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useMemberExists = (roomId: string, username: string) => {
	const checkMember = useEndpoint('GET', '/v1/rooms.isMember');

	return useQuery(['rooms/isMember', roomId, username], () => checkMember({ roomId, username }));
};
