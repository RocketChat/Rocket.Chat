import { Badge, NavBarItem } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomManager } from '../../lib/RoomManager';
import { useTeamSubscriptions, useTeamsUnreadInfo } from '../TeamsPanel/hooks/useTeamsList';
import { useTeamsPanel } from '../TeamsPanel/hooks/useTeamsPanel';
import { teamsPanelStore } from '../TeamsPanel/teamsPanelStore';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type SidebarRailTeamsProps = Omit<HTMLAttributes<HTMLElement>, 'is' | 'color'>;

const SidebarRailTeams = (props: SidebarRailTeamsProps) => {
	const { t } = useTranslation();
	const { sidebar } = useLayout();
	const { available, open, show } = useTeamsPanel();
	const expandTeam = teamsPanelStore((state) => state.expandTeam);
	const teams = useTeamSubscriptions();
	const unreadInfo = useTeamsUnreadInfo(teams);
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadInfo);
	const title = t('Teams');

	const handleClick = useStableCallback(() => {
		const rid = RoomManager.opened;
		const team = rid ? teams.find(({ main, rooms }) => main.rid === rid || rooms.some((room) => room.rid === rid)) : undefined;

		if (team) {
			expandTeam(team.key);
		}

		show();
	});

	if (!available) {
		return null;
	}

	return (
		<NavBarItem
			{...props}
			icon='team'
			title={title}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			badge={showUnread ? <Badge variant={unreadVariant}>{unreadCount.total > 99 ? '99+' : unreadCount.total}</Badge> : undefined}
			pressed={open && !sidebar.overlayed}
			onClick={handleClick}
		/>
	);
};

export default SidebarRailTeams;
