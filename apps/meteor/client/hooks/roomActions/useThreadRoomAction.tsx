import { HeaderToolbarAction, HeaderToolbarActionBadge } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomTabsEnabled } from '../../views/room/RoomTabs/hooks/useRoomTabsEnabled';
import { useThreadsUnreadBadge } from '../../views/room/hooks/useThreadsUnreadBadge';

const Threads = lazy(() => import('../../views/room/contextualBar/Threads'));

export const useThreadRoomAction = () => {
	const enabled = useSetting('Threads_enabled', false);
	const roomTabsEnabled = useRoomTabsEnabled();
	const unreadBadge = useThreadsUnreadBadge();
	const unread = unreadBadge?.label;
	const variant = unreadBadge?.variant;
	const { t } = useTranslation();

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled || roomTabsEnabled) {
			return undefined;
		}

		return {
			id: 'thread',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			full: true,
			title: 'Threads',
			icon: 'thread',
			tabComponent: Threads,
			order: 2,
			renderToolboxItem: ({ id, className, icon, title, toolbox: { tab }, disabled, action, tooltip }) => (
				<HeaderToolbarAction
					key={id}
					className={className}
					id={id}
					icon={icon}
					title={t(title)}
					pressed={id === tab?.id}
					onClick={action}
					disabled={disabled}
					tooltip={tooltip}
				>
					{!!unread && <HeaderToolbarActionBadge variant={variant}>{unread}</HeaderToolbarActionBadge>}
				</HeaderToolbarAction>
			),
		};
	}, [enabled, roomTabsEnabled, t, unread, variant]);
};
