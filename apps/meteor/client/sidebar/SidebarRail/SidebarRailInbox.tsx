import { Badge, NavBarItem } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useCurrentRoutePath, useLayout, useRouter, useSession } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useUnreadMessages } from '../../views/root/hooks/useUnreadMessages';

type SidebarRailInboxProps = Omit<HTMLAttributes<HTMLElement>, 'is' | 'color'>;

const SidebarRailInbox = (props: SidebarRailInboxProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const currentRoute = useCurrentRoutePath();
	const { sidebar } = useLayout();
	const secondarySidebarEnabled = useFeaturePreview('secondarySidebar');
	const unread = useSession('unread') as number | '' | '999+' | '•' | undefined;
	const unreadMessages = useUnreadMessages();
	const title = t('Inbox_and_home');

	const handleClick = useStableCallback(() => {
		router.navigate('/home');
	});

	return (
		<NavBarItem
			{...props}
			icon='inbox'
			title={title}
			aria-label={unreadMessages ? t('__unreadTitle__from__roomTitle__', { unreadTitle: unreadMessages, roomTitle: title }) : title}
			badge={unread ? <Badge variant='danger'>{unread}</Badge> : undefined}
			pressed={!secondarySidebarEnabled && !sidebar.overlayed}
			aria-current={currentRoute?.includes('/home') ? 'page' : undefined}
			onClick={handleClick}
		/>
	);
};

export default SidebarRailInbox;
