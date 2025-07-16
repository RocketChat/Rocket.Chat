import type { BadgeProps } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { HeaderToolbarAction, HeaderToolbarActionBadge } from '../../components/Header';
import { useRoomSubscription } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const getVariant = (tunreadUser: number, tunreadGroup: number): BadgeProps['variant'] => {
	if (tunreadUser > 0) {
		return 'danger';
	}

	if (tunreadGroup > 0) {
		return 'warning';
	}

	return 'primary';
};

const Threads = lazy(() => import('../../views/room/contextualBar/Threads'));

export const useThreadRoomAction = () => {
	const enabled = useSetting('Threads_enabled', false);
	const subscription = useRoomSubscription();

	const tunread = subscription?.tunread?.length ?? 0;
	const tunreadUser = subscription?.tunreadUser?.length ?? 0;
	const tunreadGroup = subscription?.tunreadGroup?.length ?? 0;
	const unread = tunread > 99 ? '99+' : tunread;
	const variant = getVariant(tunreadUser, tunreadGroup);
	const { t } = useTranslation();

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
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
			renderToolboxItem: ({ id, className, index, icon, title, toolbox: { tab }, action, disabled, tooltip }) => (
				<HeaderToolbarAction
					key={id}
					className={className}
					index={index}
					id={id}
					icon={icon}
					title={t(title)}
					pressed={id === tab?.id}
					action={action}
					disabled={disabled}
					tooltip={tooltip}
				>
					{!!unread && <HeaderToolbarActionBadge variant={variant}>{unread}</HeaderToolbarActionBadge>}
				</HeaderToolbarAction>
			),
		};
	}, [enabled, t, unread, variant]);
};
