import type { LazyExoticComponent, FC, ReactNode } from 'react';
import React, { useMemo, lazy } from 'react';
import type { BadgeProps } from '@rocket.chat/fuselage';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';

import { addAction } from '../../../../client/views/room/lib/Toolbox';
import Header from '../../../../client/components/Header';

const getVariant = (tunreadUser: number, tunreadGroup: number): BadgeProps['variant'] => {
	if (tunreadUser > 0) {
		return 'danger';
	}
	if (tunreadGroup > 0) {
		return 'warning';
	}
	return 'primary';
};

const template = lazy(() => import('../../../../client/views/room/contextualBar/Threads')) as LazyExoticComponent<FC>;

addAction('thread', (options) => {
	const room = options.room as unknown as ISubscription & IRoom;
	const federated = isRoomFederated(room);
	const threadsEnabled = useSetting('Threads_enabled');
	return useMemo(
		() =>
			threadsEnabled
				? {
						groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
						id: 'thread',
						full: true,
						title: 'Threads',
						icon: 'thread',
						template,
						...(federated && {
							'data-tooltip': 'Threads_unavailable_for_federation',
							'disabled': true,
						}),
						renderAction: (props): ReactNode => {
							const tunread = room.tunread?.length || 0;
							const tunreadUser = room.tunreadUser?.length || 0;
							const tunreadGroup = room.tunreadGroup?.length || 0;
							const unread = tunread > 99 ? '99+' : tunread;
							const variant = getVariant(tunreadUser, tunreadGroup);
							return (
								<Header.ToolBoxAction {...props}>
									{unread > 0 && <Header.Badge variant={variant}>{unread}</Header.Badge>}
								</Header.ToolBoxAction>
							);
						},
						order: 2,
				  }
				: null,
		[threadsEnabled, room.tunread?.length, room.tunreadUser?.length, room.tunreadGroup?.length, federated],
	);
});
