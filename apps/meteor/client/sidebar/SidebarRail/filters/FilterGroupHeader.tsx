import { Badge, Box, IconButton, SidebarCollapseGroup, SidebarCollapseGroupMenu } from '@rocket.chat/fuselage';
import type { HTMLAttributes, KeyboardEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import FilterGroupMenu from './FilterGroupMenu';
import type { FilterGroup } from './hooks/useFilterGroups';
import { usePreventPropagation } from '../../../hooks/usePreventPropagation';
import { useDeferredMenuMount } from '../../Item/useDeferredMenuMount';
import { useUnreadDisplay } from '../../hooks/useUnreadDisplay';

type FilterGroupHeaderProps = {
	group: FilterGroup;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onClick: MouseEventHandler<HTMLElement>;
	onKeyDown: (e: KeyboardEvent) => void;
} & Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'onKeyDown'>;

const FilterGroupHeader = ({ group, canMoveUp, canMoveDown, onMoveUp, onMoveDown, ...props }: FilterGroupHeaderProps) => {
	const { t } = useTranslation();
	const preventPropagation = usePreventPropagation();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(group.unreadInfo);

	const { filter, collapsed, rooms } = group;

	const badge = showUnread ? (
		<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
			{unreadCount.total}
		</Badge>
	) : undefined;

	return (
		<SidebarCollapseGroup
			title={filter.name}
			empty={rooms.length === 0}
			expanded={!collapsed}
			badge={badge}
			onFocus={mountNow}
			onPointerEnter={requestMount}
			menu={
				<SidebarCollapseGroupMenu onClick={preventPropagation}>
					{/* The group only renders its own badge while collapsed, so an expanded group shows it next to the menu. */}
					{!collapsed && badge && (
						<Box display='flex' alignItems='center' marginInlineEnd={4}>
							{badge}
						</Box>
					)}
					{menuVisibility ? (
						<FilterGroupMenu
							filter={filter}
							rooms={rooms}
							hasUnread={showUnread}
							canMoveUp={canMoveUp}
							canMoveDown={canMoveDown}
							onMoveUp={onMoveUp}
							onMoveDown={onMoveDown}
						/>
					) : (
						<IconButton tabIndex={-1} aria-hidden mini icon='kebab' onPointerDown={mountNow} />
					)}
				</SidebarCollapseGroupMenu>
			}
			aria-label={collapsed ? t('Expand_group', { group: filter.name }) : t('Collapse_group', { group: filter.name })}
			{...props}
		/>
	);
};

export default FilterGroupHeader;
