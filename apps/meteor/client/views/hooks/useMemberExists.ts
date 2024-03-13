import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useMemberExists = (roomId: string, username: string, override?: boolean) => {
	const checkMember = useEndpoint('GET', '/v1/rooms.isMember');

	return useQuery(['rooms/isMember', roomId, username, override], async () => {
		return override !== undefined ? { exists: override } : checkMember({ roomId, username });
	});
};
