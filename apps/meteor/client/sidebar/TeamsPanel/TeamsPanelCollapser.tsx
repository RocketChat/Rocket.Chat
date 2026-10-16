import { Badge, IconButton, SidebarCollapseGroup, SidebarCollapseGroupMenu } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { HTMLAttributes, KeyboardEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import TeamsPanelMenu from './TeamsPanelMenu';
import type { SidebarTeam } from './hooks/useTeamsList';
import { usePreventPropagation } from '../../hooks/usePreventPropagation';
import { useDeferredMenuMount } from '../Item/useDeferredMenuMount';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type TeamsPanelCollapserProps = {
	team: SidebarTeam;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMove: (direction: 'up' | 'down') => void;
	onClick: MouseEventHandler<HTMLElement>;
	onKeyDown: (e: KeyboardEvent) => void;
} & Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'onKeyDown'>;

const TeamsPanelCollapser = ({ team, canMoveUp, canMoveDown, onMove, ...props }: TeamsPanelCollapserProps) => {
	const { t } = useTranslation();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(team.unreadInfo);
	const preventPropagation = usePreventPropagation();
	const { mounted, requestMount, mountNow } = useDeferredMenuMount();
	// Touch screens have no hover to reveal and mount the menu, so it is there from the start and a single tap opens it.
	const isTouch = useMediaQuery('(hover: none), (pointer: coarse)');

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
			onFocus={mountNow}
			onPointerEnter={requestMount}
			menu={
				<SidebarCollapseGroupMenu onClick={preventPropagation}>
					{mounted || isTouch ? (
						<TeamsPanelMenu team={team} canMoveUp={canMoveUp} canMoveDown={canMoveDown} onMove={onMove} />
					) : (
						<IconButton tabIndex={-1} aria-hidden mini icon='kebab' onPointerDown={mountNow} />
					)}
				</SidebarCollapseGroupMenu>
			}
			aria-label={team.expanded ? t('Collapse_group', { group: team.title }) : t('Expand_group', { group: team.title })}
			{...props}
		/>
	);
};

export default TeamsPanelCollapser;
