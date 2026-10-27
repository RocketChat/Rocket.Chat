import { VisuallyHidden } from '@react-aria/visually-hidden';
import { Badge } from '@rocket.chat/fuselage';
import { HeaderToolbarAction } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { Fragment, lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomTabsEnabled } from '../../views/room/RoomTabs/hooks/useRoomTabsEnabled';
import { useThreadsUnreadBadge } from '../../views/room/hooks/useThreadsUnreadBadge';

const Threads = lazy(() => import('../../views/room/contextualBar/Threads'));

export const useThreadRoomAction = () => {
	const enabled = useSetting('Threads_enabled', false);
	const roomTabsEnabled = useRoomTabsEnabled();
	const unreadBadge = useThreadsUnreadBadge();
	const tunread = unreadBadge?.count ?? 0;
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
				<Fragment key={id}>
					<HeaderToolbarAction
						className={className}
						id={id}
						icon={icon}
						title={t(title)}
						pressed={id === tab?.id}
						onClick={action}
						disabled={disabled}
						tooltip={tooltip}
						aria-label={tunread ? t('Threads_unread_count', { count: tunread }) : undefined}
						badge={!!unread && <Badge variant={variant}>{unread}</Badge>}
					/>
					<VisuallyHidden role='status'>{!!tunread && t('Threads_unread_count', { count: tunread })}</VisuallyHidden>
				</Fragment>
			),
		};
	}, [enabled, roomTabsEnabled, t, tunread, unread, variant]);
};
