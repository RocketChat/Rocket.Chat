import { Badge, SidebarCollapseGroup } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import type { SidebarTeam } from './hooks/useTeamsList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type TeamsPanelCollapserProps = {
	team: SidebarTeam;
	onToggle: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onToggle'>;

const TeamsPanelCollapser = ({ team, onToggle, ...props }: TeamsPanelCollapserProps) => {
	const { t } = useTranslation();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(team.unreadInfo);

	return (
		<SidebarCollapseGroup
			title={team.title}
			role='listitem'
			expanded={team.expanded}
			badge={
				showUnread ? (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				) : undefined
			}
			aria-label={team.expanded ? t('Collapse_group', { group: team.title }) : t('Expand_group', { group: team.title })}
			onToggle={onToggle}
			{...props}
		/>
	);
};

export default TeamsPanelCollapser;
