import type { ISubscription } from '@rocket.chat/core-typings';
import { Badge, SidebarV2CollapseGroup } from '@rocket.chat/fuselage';
import type { HTMLAttributes, KeyboardEvent, MouseEventHandler, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListCollapserProps = {
	groupTitle: string;
	/** Visible section title (translated for built-in groups, raw name for user categories). */
	displayTitle: ReactNode;
	/** Plain-text title used for aria-labels. */
	ariaTitle: string;
	collapsedGroups: string[];
	onClick: MouseEventHandler<HTMLElement>;
	onKeyDown: (e: KeyboardEvent) => void;
	unreadCount: Pick<ISubscription, 'userMentions' | 'groupMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'tunreadGroup'>;
} & Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'onKeyDown'>;
const RoomListCollapser = ({
	groupTitle,
	displayTitle,
	ariaTitle,
	unreadCount: unreadGroupCount,
	collapsedGroups,
	...props
}: RoomListCollapserProps) => {
	const { t } = useTranslation();

	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadGroupCount);

	return (
		<SidebarV2CollapseGroup
			title={displayTitle as any}
			expanded={!collapsedGroups.includes(groupTitle)}
			badge={
				showUnread ? (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				) : undefined
			}
			aria-label={
				!collapsedGroups.includes(groupTitle) ? t('Collapse_group', { group: ariaTitle }) : t('Expand_group', { group: ariaTitle })
			}
			{...props}
		/>
	);
};

export default RoomListCollapser;
