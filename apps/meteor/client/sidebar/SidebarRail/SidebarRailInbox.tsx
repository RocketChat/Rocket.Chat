import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, NavBarItem } from '@rocket.chat/fuselage';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarRailStore } from './useSidebarRailStore';
import { buildUnreadInfo } from '../hooks/useRoomList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

const openSubscriptionsQuery = { open: { $ne: false } };

const badgeStyle = css`
	pointer-events: none;
`;

type SidebarRailInboxProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailInbox = (props: SidebarRailInboxProps) => {
	const { t } = useTranslation();
	const isActive = useSidebarRailStore((state) => state.panel === 'inbox');
	const setPanel = useSidebarRailStore((state) => state.setPanel);

	const rooms = useUserSubscriptions(openSubscriptionsQuery);
	const unreadInfo = useMemo(() => buildUnreadInfo(rooms), [rooms]);
	const { unreadTitle, unreadVariant, showUnread } = useUnreadDisplay(unreadInfo);

	const title = showUnread ? t('Inbox_with_unread', { unreadTitle }) : t('Inbox');

	return (
		<Box position='relative'>
			<NavBarItem {...props} title={title} icon='inbox' pressed={isActive} onClick={() => setPanel('inbox')} />
			{showUnread && (
				<Box position='absolute' insetBlockStart={2} insetInlineEnd={2} className={badgeStyle} aria-hidden>
					<Badge small variant={unreadVariant} />
				</Box>
			)}
		</Box>
	);
};

export default SidebarRailInbox;
