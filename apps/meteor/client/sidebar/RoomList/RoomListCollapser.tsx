import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, IconButton, Palette, SidebarCollapseGroup, SidebarCollapseGroupMenu } from '@rocket.chat/fuselage';
import { useDeferredMenuMount } from '@rocket.chat/ui-client';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import RoomListActivityFilterChip from './RoomListActivityFilterChip';
import { useIsEnterprise } from '../../hooks/useIsEnterprise';
import { usePreventPropagation } from '../../hooks/usePreventPropagation';
import CategoryMenu from '../categories/CategoryMenu';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

// The header reads as one control: pointing at its chip or kebab highlights it just like pointing at its name.
const headerStyle = css`
	& .rcx-sidebar-collapse-group__bar:hover {
		background-color: ${Palette.surface['surface-tint']};
	}
`;

// The activity filter chip sits right after the group name, so the name stops stretching across the header
// while it is shown; the kebab keeps to the far end.
const inlineChipStyle = css`
	& .rcx-sidebar-collapse-group__bar-button {
		flex: 0 1 auto;
	}

	& .rcx-sidebar-collapse-group__menu-wrapper {
		margin-inline-start: auto;
	}
`;

type RoomListCollapserProps = {
	group: SidebarRoomListGroup;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onToggleInactive: () => void;
	onClick: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown'>;

const RoomListCollapser = ({
	group,
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
	onToggleInactive,
	onClick,
	...props
}: RoomListCollapserProps) => {
	const { t } = useTranslation();
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(group.unreadInfo);
	const preventPropagation = usePreventPropagation();

	const title = group.translateTitle ? t(group.title) : group.title;

	const toggleOnEnterOrSpace = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.repeat || !['Enter', 'Space'].includes(event.code)) {
			return;
		}

		event.preventDefault();
		onClick();
	};

	const filterChip =
		!group.collapsed && group.activityFilter && group.inactiveCount > 0 ? (
			<RoomListActivityFilterChip
				activityFilter={group.activityFilter}
				inactiveCount={group.inactiveCount}
				applied={!group.showingInactive}
				onToggle={onToggleInactive}
			/>
		) : undefined;

	return (
		<Box className={[headerStyle, filterChip && inlineChipStyle]}>
			<SidebarCollapseGroup
				title={title}
				role='listitem'
				empty={group.empty}
				expanded={!group.collapsed}
				badge={
					showUnread ? (
						<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
							{unreadCount.total}
						</Badge>
					) : undefined
				}
				menu={
					isEnterprise ? (
						<>
							{filterChip}
							<SidebarCollapseGroupMenu onClick={preventPropagation} onKeyDown={preventPropagation}>
								{menuVisibility ? (
									<CategoryMenu
										category={group.category}
										groupKey={group.key}
										showUnreads={group.showUnreads}
										keepUnreadsOnTop={group.keepUnreadsOnTop}
										activityFilter={group.activityFilter}
										canMoveUp={canMoveUp}
										canMoveDown={canMoveDown}
										onMoveUp={onMoveUp}
										onMoveDown={onMoveDown}
									/>
								) : (
									<IconButton tabIndex={-1} aria-hidden size='mini' icon='kebab' onPointerDown={mountNow} />
								)}
							</SidebarCollapseGroupMenu>
						</>
					) : undefined
				}
				aria-label={group.collapsed ? t('Expand_group', { group: title }) : t('Collapse_group', { group: title })}
				onFocus={mountNow}
				onPointerEnter={requestMount}
				onClick={onClick}
				onKeyDown={toggleOnEnterOrSpace}
				{...props}
			/>
		</Box>
	);
};

export default RoomListCollapser;
