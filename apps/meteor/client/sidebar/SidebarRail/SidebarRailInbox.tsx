import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoutePath, useRouter, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRailUnreadItem from './SidebarRailUnreadItem';
import { useTeamsPanel } from '../TeamsPanel/hooks/useTeamsPanel';
import { buildUnreadInfo } from '../hooks/useRoomList';

const query = { open: { $ne: false } };

type SidebarRailInboxProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

/**
 * Opens the home page and brings back the default sidebar with all the user's rooms.
 *
 * It and the Teams item select what the sidebar shows, so exactly one of them is active at a time: this one while
 * the default sidebar is showing, whatever page is open. Unlike the Home button it replaces, it is always shown,
 * since it is the way back from the Teams panel.
 *
 * Its badge adds up the unread messages and mentions of every open room, team rooms included, since the inbox lists
 * them all.
 */
const SidebarRailInbox = (props: SidebarRailInboxProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const { open: teamsPanelOpen, close: closeTeamsPanel } = useTeamsPanel();
	const currentRoute = useCurrentRoutePath();
	const subscriptions = useUserSubscriptions(query);
	const unreadInfo = useMemo(() => buildUnreadInfo(subscriptions), [subscriptions]);

	const handleClick = useStableCallback(() => {
		closeTeamsPanel();
		router.navigate('/home');
	});

	return (
		<SidebarRailUnreadItem
			{...props}
			icon='inbox'
			title={t('Inbox_and_home')}
			unreadInfo={unreadInfo}
			pressed={!teamsPanelOpen}
			aria-current={currentRoute?.includes('/home') ? 'page' : undefined}
			onClick={handleClick}
		/>
	);
};

export default SidebarRailInbox;
