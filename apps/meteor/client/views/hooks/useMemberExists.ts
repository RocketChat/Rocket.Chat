import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type UseMemberExistsProps = { roomId: string; username: string; isMember?: boolean };

export const useMemberExists = ({ roomId, username, isMember }: UseMemberExistsProps) => {
	const checkMember = useEndpoint('GET', '/v1/rooms.isMember');

	return useQuery(['rooms/isMember', roomId, username, isMember], async () => {
		return isMember !== undefined ? { exists: isMember } : checkMember({ roomId, username });
	});
};
