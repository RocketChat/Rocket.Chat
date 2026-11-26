import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useCurrentRoutePath, useLayout, useRouter, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRailUnreadItem from './SidebarRailUnreadItem';
import { buildUnreadInfo } from '../lib/unreadRooms';

const query = { open: { $ne: false } };

type SidebarRailInboxProps = Omit<HTMLAttributes<HTMLElement>, 'is' | 'color'>;

const SidebarRailInbox = (props: SidebarRailInboxProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const currentRoute = useCurrentRoutePath();
	const { sidebar } = useLayout();
	const secondarySidebarEnabled = useFeaturePreview('secondarySidebar');
	const subscriptions = useUserSubscriptions(query);
	const unreadInfo = useMemo(() => buildUnreadInfo(subscriptions), [subscriptions]);

	const handleClick = useStableCallback(() => {
		router.navigate('/home');
	});

	return (
		<SidebarRailUnreadItem
			{...props}
			icon='inbox'
			title={t('Inbox_and_home')}
			unreadInfo={unreadInfo}
			pressed={!secondarySidebarEnabled && !sidebar.overlayed}
			aria-current={currentRoute?.includes('/home') ? 'page' : undefined}
			onClick={handleClick}
		/>
	);
};

export default SidebarRailInbox;
