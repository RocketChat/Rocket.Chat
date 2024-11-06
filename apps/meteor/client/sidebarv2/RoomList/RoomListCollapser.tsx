import type { ISubscription } from '@rocket.chat/core-typings';
import { Badge, SidebarV2CollapseGroup } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListCollapserProps = {
	groupTitle: string;
	collapsedGroups: string[];
	handleClick: (groupName: string) => void;
	handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, groupName: string) => void;
	unreadCount: Pick<ISubscription, 'userMentions' | 'groupMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'tunreadGroup'>;
};
const RoomListCollapser = ({
	groupTitle,
	unreadCount: unreadGroupCount,
	collapsedGroups,
	handleClick,
	handleKeyDown,
	...props
}: RoomListCollapserProps) => {
	const { t } = useTranslation();

	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadGroupCount);

	return (
		<SidebarV2CollapseGroup
			title={t(groupTitle)}
			onClick={() => handleClick(groupTitle)}
			onKeyDown={(e) => handleKeyDown(e, groupTitle)}
			expanded={!collapsedGroups.includes(groupTitle)}
			badge={
				showUnread ? (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				) : undefined
			}
			{...props}
		/>
	);
};

export default RoomListCollapser;
