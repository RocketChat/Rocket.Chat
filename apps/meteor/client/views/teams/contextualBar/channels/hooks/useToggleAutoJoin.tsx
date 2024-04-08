import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, usePermission, useToastMessageDispatch } from '@rocket.chat/ui-contexts';

export const useToggleAutoJoin = (room: IRoom, { reload }: { reload?: () => void }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const updateRoomEndpoint = useEndpoint('POST', '/v1/teams.updateRoom');
	const canEditTeamChannel = usePermission('edit-team-channel', room._id);

	const handleToggleAutoJoin = async () => {
		try {
			await updateRoomEndpoint({
				roomId: room._id,
				isDefault: !room.teamDefault,
			});
			dispatchToastMessage({ type: 'success', message: room.teamDefault ? 'channel set as non autojoin' : 'channel set as autojoin' });
			reload?.();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return { handleToggleAutoJoin, canEditTeamChannel };
};
