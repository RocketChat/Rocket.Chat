import type { BadgeProps } from '@rocket.chat/fuselage';
import { HeaderToolboxAction, HeaderToolboxActionBadge } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { LazyExoticComponent, FC } from 'react';
import React, { lazy, useMemo } from 'react';

import { useRoomSubscription } from '../../views/room/contexts/RoomContext';
import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const getVariant = (tunreadUser: number, tunreadGroup: number): BadgeProps['variant'] => {
	if (tunreadUser > 0) {
		return 'danger';
	}

	if (tunreadGroup > 0) {
		return 'warning';
	}

	return 'primary';
};

const Threads = lazy(() => import('../../views/room/contextualBar/Threads')) as LazyExoticComponent<FC>;

export const useThreadRoomAction = (): ToolboxActionConfig | undefined => {
	const enabled = useSetting('Threads_enabled', false);
	const subscription = useRoomSubscription();

	const tunread = subscription?.tunread?.length ?? 0;
	const tunreadUser = subscription?.tunreadUser?.length ?? 0;
	const tunreadGroup = subscription?.tunreadGroup?.length ?? 0;
	const unread = tunread > 99 ? '99+' : tunread;
	const variant = getVariant(tunreadUser, tunreadGroup);

	return useMemo(() => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'thread',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			full: true,
			title: 'Threads',
			icon: 'thread',
			template: Threads,
			renderAction: (props) => (
				<HeaderToolboxAction key={props.id} {...props}>
					{!!unread && <HeaderToolboxActionBadge variant={variant}>{unread}</HeaderToolboxActionBadge>}
				</HeaderToolboxAction>
			),
			order: 2,
		};
	}, [enabled, unread, variant]);
};
