import type { Serialized, IRoom } from '@rocket.chat/core-typings';
import { GenericModalSkeleton } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import BaseRemoveUsersModal from './BaseRemoveUsersModal';
import { teamsQueryKeys, usersQueryKeys } from '../../../../../lib/queryKeys';

type RemoveUsersModalProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (deletedRooms: { [key: string]: Serialized<IRoom> }) => void;
	teamId: string;
	userId: string;
};

const RemoveUsersModal = ({ teamId, userId, onClose, onCancel, onConfirm }: RemoveUsersModalProps) => {
	const listRoomsOfUser = useEndpoint('GET', '/v1/teams.listRoomsOfUser');
	const { isPending, data } = useQuery({
		queryKey: teamsQueryKeys.roomsOfUser(teamId, userId),
		queryFn: () => listRoomsOfUser({ teamId, userId, canUserDelete: 'true' }),
	});

	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const { data: userData } = useQuery({
		queryKey: usersQueryKeys.userInfo({ uid: userId }),
		queryFn: () => getUserInfo({ userId }),
	});

	if (isPending) {
		return <GenericModalSkeleton />;
	}

	return (
		<BaseRemoveUsersModal
			onClose={onClose}
			username={userData?.user.username ?? ''}
			onCancel={onCancel}
			onConfirm={onConfirm}
			rooms={data?.rooms ?? []}
		/>
	);
};

export default RemoveUsersModal;
