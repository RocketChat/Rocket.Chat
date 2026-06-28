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

// The header bar has its own opaque background (identical to the sidebar's) that would hide the
// wrapper's drag-over tint. Making it permanently transparent lets the wrapper's inline background
// drive the header highlight in the same render as the room rows — so they light up together.
const transparentBarClass = css`
	.rcx-sidebar-v2-collapse-group__bar {
		background-color: transparent;
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
	const { isDragOver, isFadedOut, dropProps } = useGroupDrop(group.key, Boolean(group.category));

	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(group.unreadInfo);

	const title = group.translateTitle ? t(group.title as TranslationKey) : group.title;
	// `title` (string) drives the accessible name; the collapser renders this node as the visible label,
	// so a custom category's emoji shows before its name. Cast because the prop is typed `string` but the
	// component renders it as JSX children.
	const titleContent = (group.category ? <CategoryLabel icon={group.category.icon} name={title} /> : title) as unknown as string;

	// `SidebarV2CollapseGroup` doesn't render an actions slot, so the kebab is overlaid on the header;
	// it shows on hover or while its menu is open, replacing the unread badge.
	const [hovered, setHovered] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const showActions = hovered || menuOpen;

	return (
		<Box
			{...dropProps}
			position='relative'
			className={transparentBarClass}
			style={{ backgroundColor: isDragOver ? 'var(--rcx-color-surface-hover)' : undefined, opacity: isFadedOut ? 0.4 : undefined }}
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
						canMoveUp={canMoveUp}
						canMoveDown={canMoveDown}
						onMoveUp={onMoveUp}
						onMoveDown={onMoveDown}
						onOpenChange={setMenuOpen}
					/>
				</Box>
			)}
		</Box>
	);
};

export default RoomListCollapser;
