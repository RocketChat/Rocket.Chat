import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoutePath, useRouter, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRailUnreadItem from './SidebarRailUnreadItem';
import { useTeamsPanel } from '../TeamsPanel/hooks/useTeamsPanel';
import { buildUnreadInfo } from '../lib/unreadRooms';

const query = { open: { $ne: false } };

type SidebarRailInboxProps = Omit<HTMLAttributes<HTMLElement>, 'is' | 'color'>;

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
			title={t('Inbox')}
			unreadInfo={unreadInfo}
			pressed={!teamsPanelOpen}
			aria-current={currentRoute?.includes('/home') ? 'page' : undefined}
			onClick={handleClick}
		/>
	);
};

export default SidebarRailInbox;
