import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRailUnreadItem from './SidebarRailUnreadItem';
import { useTeamsUnreadInfo } from '../TeamsPanel/hooks/useTeamsList';
import { useTeamsPanel } from '../TeamsPanel/hooks/useTeamsPanel';

type SidebarRailTeamsProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

/**
 * Shows the Teams panel, which replaces the sidebar room list with the user's teams and the rooms in each. It and
 * the Inbox and home item select what the sidebar shows, so only one of them is active at a time.
 * The badge adds up the unread messages and mentions of every room in every team.
 */
const SidebarRailTeams = (props: SidebarRailTeamsProps) => {
	const { t } = useTranslation();
	const { available, open, show } = useTeamsPanel();
	const unreadInfo = useTeamsUnreadInfo();

	if (!available) {
		return null;
	}

	return <SidebarRailUnreadItem {...props} icon='team' title={t('Teams')} unreadInfo={unreadInfo} pressed={open} onClick={show} />;
};

export default SidebarRailTeams;
