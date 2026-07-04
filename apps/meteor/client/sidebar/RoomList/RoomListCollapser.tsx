import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, SidebarV2CollapseGroup } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, KeyboardEvent, MouseEventHandler } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGroupDrop } from '../../views/navigation/sidebar/categories/CategoryDnDContext';
import CategoryLabel from '../../views/navigation/sidebar/categories/CategoryLabel';
import CategoryMenu from '../../views/navigation/sidebar/categories/CategoryMenu';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

const barStylingClass = css`
	/* The header bar's opaque background (identical to the sidebar's) would hide the wrapper's drag-over
	   tint; keeping it transparent lets the wrapper's inline background drive the header highlight in the
	   same render as the room rows. The hover background lives on the bar, so it gets the same rounding;
	   the reduced inline padding keeps the header icon aligned with the room avatars despite the inset. */
	.rcx-sidebar-v2-collapse-group__bar {
		min-height: 0;
		/* Equal inner padding on all sides (the -1px accounts for the bar's 1px transparent border). */
		padding: calc(0.25rem - 1px);
		background-color: transparent;
		border-radius: var(--rcx-border-radius-medium, 0.25rem);
	}

	/* Hide the built-in chevron; the group icon and the (hover-revealed) chevron are rendered together in
	   the title's leading slot so they share one place without shifting the title. */
	.rcx-sidebar-v2-collapse-group__bar .rcx-chevron {
		display: none;
	}
`;

type RoomListCollapserProps = {
	group: SidebarRoomListGroup;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onClick: MouseEventHandler<HTMLElement>;
	onKeyDown: (e: KeyboardEvent) => void;
} & Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'onKeyDown'>;

const RoomListCollapser = ({ group, canMoveUp, canMoveDown, onMoveUp, onMoveDown, ...props }: RoomListCollapserProps) => {
	const { t } = useTranslation();
	const { isDragOver, isFadedOut, accepts, dropProps } = useGroupDrop(group.key, Boolean(group.category));

	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(group.unreadInfo);

	// Empty categories are dimmed while closed, so the (always-visible) empty system categories don't clutter.
	// The dim lifts while dragging when this category is a valid drop target, so it reads as an inviting drop zone.
	const dimmed = isFadedOut || (group.empty && group.collapsed && !accepts);

	const title = group.translateTitle ? t(group.title as TranslationKey) : group.title;
	// `title` (string) drives the accessible name; the collapser renders this node as the visible label, with
	// a leading icon (emoji/folder for custom, type icon for system) so all groups align. Cast because the
	// prop is typed `string` but the component renders it as JSX children.
	const titleContent = (
		<CategoryLabel emoji={group.category?.icon} iconName={group.icon} name={title} collapsed={group.collapsed} unread={showUnread} />
	) as unknown as string;

	// `SidebarV2CollapseGroup` doesn't render an actions slot, so the kebab is overlaid on the header;
	// it shows on hover or while its menu is open, replacing the unread badge.
	const [hovered, setHovered] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const showActions = hovered || menuOpen;

	return (
		// Outer wrapper adds space ABOVE every category (separating it from the previous category's items, and
		// the first one from the sidebar header). It must be padding, not margin — virtuoso measures the rendered
		// height, and a top margin would collapse out and let the header overlap its items. The sidebar-colored
		// background makes the whole header footprint opaque so it cleanly covers the rooms behind it while
		// virtuoso keeps it stuck at the top (over the sidebar it's identical to the transparent gap).
		<Box
			{...dropProps}
			style={{
				paddingBlockStart: '0.5rem',
				backgroundColor:
					'var(--rcx-sidebar-color-surface-default, var(--rcx-color-surface-sidebar, var(--rcx-color-neutral-400, #e4e7ea)))',
				opacity: dimmed ? 0.4 : undefined,
			}}
		>
			<Box
				position='relative'
				className={barStylingClass}
				data-drop-group={group.key}
				style={{
					// Inset highlight matching the room rows: the hover tint lives on the bar, the drag-over tint here.
					// Drag-over only tints the background, keeping the inset rounding so the drop area stays rounded.
					marginInline: '0.5rem',
					borderRadius: 'var(--rcx-border-radius-medium, 0.25rem)',
					backgroundColor: isDragOver ? 'var(--rcx-color-surface-hover)' : undefined,
				}}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				<SidebarV2CollapseGroup
					title={titleContent}
					expanded={!group.collapsed}
					badge={
						!showActions && showUnread ? (
							<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
								{unreadCount.total}
							</Badge>
						) : undefined
					}
					aria-label={group.collapsed ? t('Expand_group', { group: title }) : t('Collapse_group', { group: title })}
					{...props}
				/>
				{showActions && (
					<Box position='absolute' insetBlockStart={4} insetInlineEnd={8}>
						<CategoryMenu
							category={group.category}
							groupKey={group.key}
							showUnreads={group.showUnreads}
							keepUnreadsOnTop={group.keepUnreadsOnTop}
							canMoveUp={canMoveUp}
							canMoveDown={canMoveDown}
							onMoveUp={onMoveUp}
							onMoveDown={onMoveDown}
							onOpenChange={setMenuOpen}
						/>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default RoomListCollapser;
