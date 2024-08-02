import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, usePermission, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { t } from 'i18next';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

export const useToggleAutoJoin = (room: IRoom, { reload, mainRoom }: { reload?: () => void; mainRoom: IRoom }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const updateRoomEndpoint = useEndpoint('POST', '/v1/teams.updateRoom');
	const canEditTeamChannel = usePermission('edit-team-channel', room._id);
	const maxNumberOfAutoJoinMembers = useSetting<number>('API_User_Limit');

	const handleToggleAutoJoin = async () => {
		// Sanity check, the setting has a default value, therefore it should always be defined
		if (!maxNumberOfAutoJoinMembers) {
			return;
		}

		try {
			const { room: updatedRoom } = await updateRoomEndpoint({
				roomId: room._id,
				isDefault: !room.teamDefault,
			});
			if (updatedRoom.teamDefault) {
				// If the number of members in the mainRoom (the team) is greater than the limit, show an info message
				// informing that not all members will be auto-joined to the channel
				const messageType = mainRoom.usersCount > maxNumberOfAutoJoinMembers ? 'info' : 'success';
				const message = mainRoom.usersCount > maxNumberOfAutoJoinMembers ? 'Team_Auto-join_exceeded_user_limit' : 'Team_Auto-join_updated';

				dispatchToastMessage({
					type: messageType,
					message: t(message, {
						channelName: roomCoordinator.getRoomName(room.t, room),
						numberOfMembers: updatedRoom.usersCount,
						limit: maxNumberOfAutoJoinMembers,
					}),
				});
			}
			reload?.();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return { handleToggleAutoJoin, canEditTeamChannel };
};
