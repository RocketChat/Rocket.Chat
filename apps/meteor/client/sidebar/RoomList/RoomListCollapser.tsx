import type { ISubscription } from '@rocket.chat/core-typings';
import { Badge, Box, SidebarV2CollapseGroup } from '@rocket.chat/fuselage';
import type { HTMLAttributes, KeyboardEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import CategoryMenu from '../categories/CategoryMenu';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListCollapserProps = {
	groupTitle: string;
	collapsedGroups: string[];
	onClick: MouseEventHandler<HTMLElement>;
	onKeyDown: (e: KeyboardEvent) => void;
	unreadCount: Pick<ISubscription, 'userMentions' | 'groupMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'tunreadGroup'>;
	/** Present when this group is a user-defined category, which renders its raw name and a menu. */
	category?: { id: string; name: string };
} & Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'onKeyDown'>;
const RoomListCollapser = ({ groupTitle, unreadCount: unreadGroupCount, collapsedGroups, category, ...props }: RoomListCollapserProps) => {
	const { t } = useTranslation();

	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadGroupCount);

	const displayTitle = category ? category.name : t(groupTitle);

	const collapseGroup = (
		<SidebarV2CollapseGroup
			title={displayTitle}
			expanded={!collapsedGroups.includes(groupTitle)}
			badge={
				showUnread ? (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				) : undefined
			}
			aria-label={
				!collapsedGroups.includes(groupTitle) ? t('Collapse_group', { group: displayTitle }) : t('Expand_group', { group: displayTitle })
			}
			{...props}
		/>
	);

	if (!category) {
		return collapseGroup;
	}

	// This fuselage build's SidebarV2CollapseGroup ignores its `actions` slot, so the
	// category menu is overlaid on the header bar instead. The menu stops click/key
	// propagation internally so it never toggles the group.
	return (
		<Box position='relative'>
			{collapseGroup}
			<Box position='absolute' insetBlockStart={0} insetBlockEnd={0} insetInlineEnd={4} display='flex' alignItems='center'>
				<CategoryMenu categoryId={category.id} categoryName={category.name} />
			</Box>
		</Box>
	);
};

export default RoomListCollapser;
