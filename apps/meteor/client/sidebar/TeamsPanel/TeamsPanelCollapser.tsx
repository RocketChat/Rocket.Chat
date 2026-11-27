import { Badge, IconButton, SidebarCollapseGroup, SidebarCollapseGroupMenu } from '@rocket.chat/fuselage';
import { useDeferredMenuMount } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import TeamsPanelMenu from './TeamsPanelMenu';
import type { SidebarTeam } from './hooks/useTeamsList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type TeamsPanelCollapserProps = {
	team: SidebarTeam;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onToggle: () => void;
};

const TeamsPanelCollapser = ({ team, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onToggle }: TeamsPanelCollapserProps) => {
	const { t } = useTranslation();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(team.unreadInfo);
	const { mounted: menuMounted, requestMount, mountNow } = useDeferredMenuMount();

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
			menu={
				<SidebarCollapseGroupMenu>
					{menuMounted ? (
						<TeamsPanelMenu team={team} canMoveUp={canMoveUp} canMoveDown={canMoveDown} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
					) : (
						<IconButton tabIndex={-1} aria-hidden size='mini' icon='kebab' onPointerDown={mountNow} />
					)}
				</SidebarCollapseGroupMenu>
			}
			aria-label={team.expanded ? t('Collapse_group', { group: team.title }) : t('Expand_group', { group: team.title })}
			onFocus={mountNow}
			onPointerEnter={requestMount}
			onToggle={onToggle}
		/>
	);
};

export default TeamsPanelCollapser;
