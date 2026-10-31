import { Badge, IconButton, SidebarCollapseGroup, SidebarCollapseGroupMenu } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useDeferredMenuMount } from '@rocket.chat/ui-client';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import TeamsPanelMenu from './TeamsPanelMenu';
import type { SidebarTeam } from './hooks/useTeamsList';
import { usePreventPropagation } from '../../hooks/usePreventPropagation';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type TeamsPanelCollapserProps = {
	team: SidebarTeam;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMove: (direction: 'up' | 'down') => void;
	onClick: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown'>;

const TeamsPanelCollapser = ({ team, canMoveUp, canMoveDown, onMove, onClick, ...props }: TeamsPanelCollapserProps) => {
	const { t } = useTranslation();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(team.unreadInfo);
	const preventPropagation = usePreventPropagation();
	const { mounted, requestMount, mountNow } = useDeferredMenuMount();
	// Touch screens have no hover to reveal and mount the menu, so it is there from the start and a single tap opens it.
	const isTouch = useMediaQuery('(hover: none), (pointer: coarse)');

	// Keys pressed on the team's options menu, or inside it, bubble up to the section too; only the header toggles.
	const toggleOnEnterOrSpace = (event: KeyboardEvent<HTMLDivElement>) => {
		if (
			event.repeat ||
			!['Enter', 'Space'].includes(event.code) ||
			!(event.target as HTMLElement).classList.contains('rcx-sidebar-collapse-group__bar-button')
		) {
			return;
		}

		event.preventDefault();
		onClick();
	};

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
			onClick={onClick}
			onKeyDown={toggleOnEnterOrSpace}
			{...props}
		/>
	);
};

export default TeamsPanelCollapser;
