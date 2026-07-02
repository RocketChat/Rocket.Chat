import type { ISubscription } from '@rocket.chat/core-typings';
import { Badge, SidebarV2CollapseGroup } from '@rocket.chat/fuselage';
import type { HTMLAttributes, KeyboardEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListCollapserProps = {
	groupTitle: string;
	collapsedGroups: string[];
	onClick: MouseEventHandler<HTMLElement>;
	onKeyDown: (e: KeyboardEvent) => void;
	unreadCount: Pick<ISubscription, 'userMentions' | 'groupMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'tunreadGroup'>;
} & Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'onKeyDown'>;
const RoomListCollapser = ({ groupTitle, unreadCount: unreadGroupCount, collapsedGroups, ...props }: RoomListCollapserProps) => {
	const { t } = useTranslation();

	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadGroupCount);

	const titleText = groupTitle.startsWith('dm_folder_')
		? groupTitle.substring('dm_folder_'.length)
		: t(groupTitle);

	return (
		<SidebarV2CollapseGroup
			title={titleText}
			expanded={!collapsedGroups.includes(groupTitle)}
			badge={
				showUnread ? (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				) : undefined
			}
			aria-label={
				!collapsedGroups.includes(groupTitle) ? t('Collapse_group', { group: titleText }) : t('Expand_group', { group: titleText })
			}
			{...props}
		/>
	);
};

export default RoomListCollapser;
