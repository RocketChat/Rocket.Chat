import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, NavBarItem } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import type { GroupUnreadInfo } from '../hooks/useRoomList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type SidebarRailUnreadItemProps = Omit<ComponentProps<typeof NavBarItem>, 'is' | 'title'> & {
	title: string;
	unreadInfo: GroupUnreadInfo;
};

const badgeStyle = css`
	position: absolute;
	inset-block-start: -4px;
	inset-inline-end: -4px;
	pointer-events: none;
`;

/** A rail item with a badge for the unread messages and mentions of the rooms it leads to. */
const SidebarRailUnreadItem = ({ title, unreadInfo, ...props }: SidebarRailUnreadItemProps) => {
	const { t } = useTranslation();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadInfo);

	const label = showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title;

	return (
		<Box position='relative'>
			<NavBarItem {...props} title={title} aria-label={label} />
			{showUnread && (
				<Box className={badgeStyle} aria-hidden>
					<Badge small variant={unreadVariant}>
						{unreadCount.total > 99 ? '99+' : unreadCount.total}
					</Badge>
				</Box>
			)}
		</Box>
	);
};

export default SidebarRailUnreadItem;
