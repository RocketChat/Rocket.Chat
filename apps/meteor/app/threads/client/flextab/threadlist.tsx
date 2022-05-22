import React, { useMemo, lazy, LazyExoticComponent, FC, ReactNode } from 'react';
import { BadgeProps } from '@rocket.chat/fuselage';
import type { ISubscription } from '@rocket.chat/core-typings';
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
	const room = options.room as unknown as ISubscription;
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
		[threadsEnabled, room.tunread?.length, room.tunreadUser?.length, room.tunreadGroup?.length],
	);
});
