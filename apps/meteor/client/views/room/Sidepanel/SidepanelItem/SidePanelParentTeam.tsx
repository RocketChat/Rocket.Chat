import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import SidePanelTag from './SidePanelTag';
import SidePanelTagIcon from './SidePanelTagIcon';
import { useParentTeamData } from './useParentTeamData';

const SidePanelParentTeam = ({ room }: { room: SubscriptionWithRoom }) => {
	const { redirectToMainRoom, teamName, shouldDisplayTeam, teamInfoError, isTeamPublic } = useParentTeamData(room);

	if (teamInfoError || !shouldDisplayTeam) {
		return null;
	}

	return (
		<SidePanelTag
			onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter') && redirectToMainRoom()}
			onClick={(e) => {
				e.preventDefault();
				redirectToMainRoom();
			}}
		>
			<SidePanelTagIcon icon={{ name: isTeamPublic ? 'team' : 'team-lock' }} />
			{teamName}
		</SidePanelTag>
	);
};

export default SidePanelParentTeam;
