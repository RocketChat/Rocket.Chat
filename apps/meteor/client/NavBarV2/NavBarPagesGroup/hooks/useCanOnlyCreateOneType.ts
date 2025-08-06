import { usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useCanOnlyCreateOneType = (teamId?: string) => {
	const canCreateChannel = usePermission('create-c');
	const canCreatePrivateChannel = usePermission('create-p');

	const canCreateTeamChannel = usePermission('create-team-channel', teamId);
	const canCreateTeamGroup = usePermission('create-team-group', teamId);

	return useMemo(() => {
		if ((!teamId && !canCreateChannel && canCreatePrivateChannel) || (teamId && !canCreateTeamChannel && canCreateTeamGroup)) {
			return 'p';
		}
		if ((!teamId && canCreateChannel && !canCreatePrivateChannel) || (teamId && canCreateTeamChannel && !canCreateTeamGroup)) {
			return 'c';
		}
		return false;
	}, [canCreateChannel, canCreatePrivateChannel, canCreateTeamChannel, canCreateTeamGroup, teamId]);
};
