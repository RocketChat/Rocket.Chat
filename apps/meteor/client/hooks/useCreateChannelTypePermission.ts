import type { IRoom } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

/**
 * Determines if a user's permissions restrict them to creating only one type of channel.
 *
 * This hook checks a user's permissions for creating public and private channels,
 * either globally or within a specific team. It returns a string indicating the
 * single channel type they can create, or `false` if they can create both or neither.
 *
 * @param {string} [teamRoomId] The optional ID of the main team room to check for team-specific permissions.
 * @returns {'c' | 'p' | false} A string ('c' or 'p') if the user can only create one channel type, otherwise `false`.
 */
export const useCreateChannelTypePermission = (teamRoomId?: IRoom['_id']) => {
	const canCreateChannel = usePermission('create-c');
	const canCreatePrivateChannel = usePermission('create-p');

	const canCreateTeamChannel = usePermission('create-team-channel', teamRoomId);
	const canCreateTeamGroup = usePermission('create-team-group', teamRoomId);

	return useMemo(() => {
		if (teamRoomId) {
			if (!canCreateTeamChannel && canCreateTeamGroup) {
				return 'p';
			}

			if (canCreateTeamChannel && !canCreateTeamGroup) {
				return 'c';
			}
		}

		if (!canCreateChannel && canCreatePrivateChannel) {
			return 'p';
		}

		if (canCreateChannel && !canCreatePrivateChannel) {
			return 'c';
		}
		return false;
	}, [canCreateChannel, canCreatePrivateChannel, canCreateTeamChannel, canCreateTeamGroup, teamRoomId]);
};
