import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRailUnreadItem from './SidebarRailUnreadItem';
import { RoomManager } from '../../lib/RoomManager';
import { useTeamSubscriptions, useTeamsUnreadInfo } from '../TeamsPanel/hooks/useTeamsList';
import { useTeamsPanel } from '../TeamsPanel/hooks/useTeamsPanel';
import { teamsPanelStore } from '../TeamsPanel/teamsPanelStore';

type SidebarRailTeamsProps = Omit<HTMLAttributes<HTMLElement>, 'is' | 'color'>;

const SidebarRailTeams = (props: SidebarRailTeamsProps) => {
	const { t } = useTranslation();
	const { available, open, show } = useTeamsPanel();
	const expandTeam = teamsPanelStore((state) => state.expandTeam);
	const teams = useTeamSubscriptions();
	const unreadInfo = useTeamsUnreadInfo(teams);

	if (!available) {
		return null;
	}

	const handleClick = () => {
		const rid = RoomManager.opened;
		const team = rid && teams.find(({ main, rooms }) => main.rid === rid || rooms.some((room) => room.rid === rid));

		if (team) {
			expandTeam(team.key);
		}

		show();
	};

	return <SidebarRailUnreadItem {...props} icon='team' title={t('Teams')} unreadInfo={unreadInfo} pressed={open} onClick={handleClick} />;
};

export default SidebarRailTeams;
