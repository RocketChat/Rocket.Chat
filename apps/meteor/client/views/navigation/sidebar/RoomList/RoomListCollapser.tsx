import type { ISubscription } from '@rocket.chat/core-typings';
import { Badge, SidebarCollapseGroup } from '@rocket.chat/fuselage';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import type { AllGroupsKeys } from '../../contexts/RoomsNavigationContext';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

export type RoomListCollapserProps = {
	group: AllGroupsKeys;
	groupTitle: string;
	collapsedGroups: string[];
	onClick: () => void;
	unreadCount: Pick<ISubscription, 'userMentions' | 'groupMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'tunreadGroup'>;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown'>;

const RoomListCollapser = ({
	groupTitle,
	unreadCount: unreadGroupCount,
	collapsedGroups,
	group,
	onClick,
	...props
}: RoomListCollapserProps) => {
	const { t } = useTranslation();

	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadGroupCount);
	const title = t(groupTitle);
	const expanded = !collapsedGroups.includes(group);

	const toggleOnEnterOrSpace = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.repeat || !['Enter', 'Space'].includes(event.code)) {
			return;
		}

		event.preventDefault();
		onClick();
	};

	return (
		<SidebarCollapseGroup
			title={title}
			expanded={expanded}
			badge={
				showUnread ? (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				) : undefined
			}
			onClick={onClick}
			onKeyDown={toggleOnEnterOrSpace}
			{...props}
		/>
	);
};

export default RoomListCollapser;
