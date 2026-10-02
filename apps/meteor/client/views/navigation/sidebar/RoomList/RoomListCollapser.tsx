import type { ISubscription } from '@rocket.chat/core-typings';
import { Badge, Box, Chevron, ItemGroupHeader, ItemGroupTitle } from '@rocket.chat/fuselage';
import type { HTMLAttributes, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import type { AllGroupsKeys } from '../../contexts/RoomsNavigationContext';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

export type RoomListCollapserProps = {
	group: AllGroupsKeys;
	groupTitle: string;
	collapsedGroups: string[];
	onClick: MouseEventHandler<HTMLButtonElement>;
	unreadCount: Pick<ISubscription, 'userMentions' | 'groupMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'tunreadGroup'>;
} & Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'color' | 'is'>;

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

	return (
		<Box
			is='section'
			paddingInline={4}
			aria-label={expanded ? t('Collapse_group', { group: title }) : t('Expand_group', { group: title })}
			{...props}
		>
			<ItemGroupHeader>
				<ItemGroupTitle is='button' aria-expanded={expanded} onClick={onClick}>
					<Chevron size='x16' right={!expanded} />
					<Box is='span' withTruncatedText>
						{title}
					</Box>
				</ItemGroupTitle>
				{showUnread && (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				)}
			</ItemGroupHeader>
		</Box>
	);
};

export default RoomListCollapser;
