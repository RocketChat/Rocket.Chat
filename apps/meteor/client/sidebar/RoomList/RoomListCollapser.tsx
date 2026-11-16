import { Badge, IconButton, SidebarCollapseGroup, SidebarCollapseGroupMenu } from '@rocket.chat/fuselage';
import { useDeferredMenuMount, useIsEnterprise } from '@rocket.chat/ui-client';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import RoomListActivityFilterChip from './RoomListActivityFilterChip';
import { usePreventPropagation } from '../../hooks/usePreventPropagation';
import ArchivedGroupMenu from '../categories/ArchivedGroupMenu';
import CategoryMenu from '../categories/CategoryMenu';
import { SIDEBAR_ARCHIVED_GROUP_KEY } from '../hooks/useCategoryList';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListCollapserProps = {
	group: SidebarRoomListGroup;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onToggleInactive: () => void;
	/** The user chose a window from the group's Filter submenu; `undefined` means "All". */
	onActivityFilterChange: (activityFilterHours: number | undefined) => void;
	onClick: () => void;
	dragging?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown'>;

const RoomListCollapser = ({
	group,
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
	onToggleInactive,
	onActivityFilterChange,
	onClick,
	...props
}: RoomListCollapserProps) => {
	const { t } = useTranslation();
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(group.unreadInfo);
	const preventPropagation = usePreventPropagation();

	const title = group.translateTitle ? t(group.title) : group.title;
	// The archived rooms: nothing to move, filter or badge; their menu only mutes or unmutes them.
	const isArchivedGroup = group.key === SIDEBAR_ARCHIVED_GROUP_KEY;

	const toggleOnEnterOrSpace = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.repeat || !['Enter', 'Space'].includes(event.code)) {
			return;
		}

		event.preventDefault();
		onClick();
	};

	// Shown whenever the expanded group has a filter, even one that hides nothing right now, so the filter is seen.
	const filterChip =
		!group.collapsed && group.activityFilterHours ? (
			<RoomListActivityFilterChip
				activityFilterHours={group.activityFilterHours}
				inactiveCount={group.inactiveCount}
				applied={!group.showingInactive}
				onToggle={onToggleInactive}
			/>
		) : undefined;

	// Mounted on demand, as the rows' menus are; the archived group has a menu of its own.
	const groupMenu = (() => {
		if (!menuVisibility) {
			return <IconButton tabIndex={-1} aria-hidden size='mini' icon='kebab' onPointerDown={mountNow} />;
		}
		if (isArchivedGroup) {
			return <ArchivedGroupMenu rooms={group.allRooms} />;
		}
		return (
			<CategoryMenu
				category={group.category}
				groupKey={group.key}
				groupTitle={title}
				rooms={group.allRooms}
				showUnreads={group.showUnreads}
				keepUnreadsOnTop={group.keepUnreadsOnTop}
				activityFilterHours={group.activityFilterHours}
				activityFilterHidesUnreads={group.activityFilterHidesUnreads}
				canMoveUp={canMoveUp}
				canMoveDown={canMoveDown}
				onMoveUp={onMoveUp}
				onMoveDown={onMoveDown}
				onActivityFilterChange={onActivityFilterChange}
			/>
		);
	})();

	return (
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
			actions={filterChip}
			menu={
				isEnterprise ? (
					<SidebarCollapseGroupMenu onClick={preventPropagation} onKeyDown={preventPropagation}>
						{groupMenu}
					</SidebarCollapseGroupMenu>
				) : undefined
			}
			aria-label={group.collapsed ? t('Expand_group', { group: title }) : t('Collapse_group', { group: title })}
			onFocus={mountNow}
			onPointerEnter={requestMount}
			onClick={onClick}
			onKeyDown={toggleOnEnterOrSpace}
			{...props}
		/>
	);
};

export default RoomListCollapser;
