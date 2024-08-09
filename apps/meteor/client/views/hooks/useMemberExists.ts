import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type UseMemberExistsProps = { roomId: string; username: string };

export const useMemberExists = ({ roomId, username }: UseMemberExistsProps) => {
	const checkMember = useEndpoint('GET', '/v1/rooms.isMember');

	return useQuery(['rooms/isMember', roomId, username], () => checkMember({ roomId, username }));
};
