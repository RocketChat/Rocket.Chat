import { Box, NavBarItem } from '@rocket.chat/fuselage';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { /* useEffect */ useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// import tinykeys from 'tinykeys';

import SidebarRailItemBadge from './SidebarRailItemBadge';
import { useSidebarRailStore } from './useSidebarRailStore';
import { buildUnreadInfo } from '../hooks/useRoomList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

const openSubscriptionsQuery = { open: { $ne: false } };

const getInboxShortcutLabel = () => (window.navigator.platform.toLowerCase().includes('mac') ? '(⌘+Shift+U)' : '(Ctrl+Shift+U)');

type SidebarRailInboxProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailInbox = (props: SidebarRailInboxProps) => {
	const { t } = useTranslation();
	const isActive = useSidebarRailStore((state) => state.panel === 'inbox');
	const setPanel = useSidebarRailStore((state) => state.setPanel);

	const rooms = useUserSubscriptions(openSubscriptionsQuery);
	const unreadInfo = useMemo(() => buildUnreadInfo(rooms), [rooms]);
	const unreadResult = useUnreadDisplay(unreadInfo);
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = unreadResult;

	const label = showUnread ? t('Inbox_with_unread', { unreadTitle }) : t('Inbox');

	return (
		<Box position='relative'>
			<NavBarItem
				{...props}
				title={`${label} ${getInboxShortcutLabel()}`}
				icon='inbox'
				pressed={isActive}
				aria-keyshortcuts='Control+Shift+U Meta+Shift+U'
				onClick={() => setPanel('inbox')}
			/>
			{showUnread && <SidebarRailItemBadge variant={unreadVariant}>{unreadCount.total}</SidebarRailItemBadge>}
		</Box>
	);
};

export default SidebarRailInbox;
