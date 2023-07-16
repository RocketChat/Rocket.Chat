import { isRoomFederated } from '@rocket.chat/core-typings';
import type { BadgeProps } from '@rocket.chat/fuselage';
import { HeaderToolboxAction, HeaderToolboxActionBadge } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { LazyExoticComponent, FC } from 'react';
import React, { lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ui } from '../../lib/ui';
import { useRoom, useRoomSubscription } from '../../views/room/contexts/RoomContext';

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

export const useThreadRoomAction = () => {
	const enabled = useSetting('Threads_enabled', false);
	const room = useRoom();
	const federated = isRoomFederated(room);
	const subscription = useRoomSubscription();

	const tunread = subscription?.tunread?.length ?? 0;
	const tunreadUser = subscription?.tunreadUser?.length ?? 0;
	const tunreadGroup = subscription?.tunreadGroup?.length ?? 0;
	const unread = tunread > 99 ? '99+' : tunread;
	const variant = getVariant(tunreadUser, tunreadGroup);
	const { t } = useTranslation();

	useEffect(() => {
		if (!enabled) {
			return;
		}

		return ui.addRoomAction('thread', {
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			id: 'thread',
			full: true,
			title: 'Threads',
			icon: 'thread',
			template: Threads,
			...(federated && {
				tooltip: t('core.Threads_unavailable_for_federation'),
				disabled: true,
			}),
			renderAction: (props) => (
				<HeaderToolboxAction key={props.id} {...props}>
					{!!unread && <HeaderToolboxActionBadge variant={variant}>{unread}</HeaderToolboxActionBadge>}
				</HeaderToolboxAction>
			),
			order: 2,
		});
	}, [enabled, federated, t, unread, variant]);
};
