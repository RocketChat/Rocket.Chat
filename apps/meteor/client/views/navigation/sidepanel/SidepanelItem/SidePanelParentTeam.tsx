import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import SidePanelTag from './SidePanelTag';
import SidePanelTagIcon from './SidePanelTagIcon';
import { useParentTeamData } from './useParentTeamData';

export type SidePanelParentTeamProps = { room: SubscriptionWithRoom };

const SidePanelParentTeam = ({ room }: SidePanelParentTeamProps) => {
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
