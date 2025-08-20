import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import SidePanelTag from './SidePanelTag';
import SidePanelTagIcon from './SidePanelTagIcon';
import { useParentTeamData } from './useParentTeamData';

const SidePanelParentTeam = ({ room }: { room: SubscriptionWithRoom }) => {
	const { teamName, shouldDisplayTeam, teamInfoError, isTeamPublic } = useParentTeamData(room.teamId);

	if (teamInfoError || !shouldDisplayTeam) {
		return null;
	}

	return (
		<SidePanelTag>
			<SidePanelTagIcon icon={{ name: isTeamPublic ? 'team' : 'team-lock' }} />
			{teamName}
		</SidePanelTag>
	);
};

export default SidePanelParentTeam;
