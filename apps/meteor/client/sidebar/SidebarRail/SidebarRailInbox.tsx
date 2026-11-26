import { Badge, NavBarItem } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useCurrentRoutePath, useLayout, useRouter, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls, useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';
import type { HTMLAttributes } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../views/omnichannel/hooks/useQueuedInquiries';
import { getRoomCategory, useCategoryList } from '../hooks/useCategoryList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';
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
	const categoryList = useCategoryList(useOmnichannelEnabled(), useQueuedInquiries().enabled);
	const incomingCalls = useVideoConfIncomingCalls();
	const conferenceWindowEnabled = useVideoConfWindowEnabled();

	const unreadInfo = useMemo(() => {
		const groups = new Map(categoryList.map((category) => [category, new Set<SubscriptionWithRoom>()]));
		const hasIncomingCalls = (rid: SubscriptionWithRoom['rid']) =>
			!conferenceWindowEnabled && incomingCalls.some((call) => call.rid === rid);

		return buildUnreadInfo(
			subscriptions.filter((room) => {
				const category = getRoomCategory(room, { groups, hasIncomingCalls });
				return category && groups.has(category);
			}),
		);
	}, [categoryList, subscriptions, incomingCalls, conferenceWindowEnabled]);

	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadInfo);
	const title = t('Inbox_and_home');

	const handleClick = useStableCallback(() => {
		router.navigate('/home');
	});

	return (
		<NavBarItem
			{...props}
			icon='inbox'
			title={title}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			badge={showUnread ? <Badge variant={unreadVariant}>{unreadCount.total > 99 ? '99+' : unreadCount.total}</Badge> : undefined}
			pressed={!secondarySidebarEnabled && !sidebar.overlayed}
			aria-current={currentRoute?.includes('/home') ? 'page' : undefined}
			onClick={handleClick}
		/>
	);
};

export default SidebarRailInbox;
