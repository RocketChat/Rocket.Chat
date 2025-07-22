import { SidebarV2ItemTag } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import SidePanelTagIcon from './SidePanelTagIcon';
import { useParentTeamData } from './useParentTeamData';

const SidePanelParentTeam = ({ room }: { room: SubscriptionWithRoom }) => {
	const { redirectToMainRoom, teamName, shouldDisplayTeam, teamInfoError, isTeamPublic } = useParentTeamData(room);

	const buttonProps = useButtonPattern((e) => {
		e.preventDefault();
		redirectToMainRoom();
	});

	if (teamInfoError || !shouldDisplayTeam) {
		return null;
	}

	return (
		<SidebarV2ItemTag {...buttonProps}>
			<SidePanelTagIcon icon={{ name: isTeamPublic ? 'team' : 'team-lock' }} />
			{teamName}
		</SidebarV2ItemTag>
	);
};

export default SidePanelParentTeam;
