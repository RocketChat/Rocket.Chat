import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import { Option, Badge } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { addAction } from '../../../client/views/room/lib/Toolbox';
import Header from '../../../client/components/Header';

addAction('livestream', ({ room }) => {
	const enabled = useSetting('Livestream_enabled');
	const t = useTranslation();
	const federated = isRoomFederated(room);
	const isLive = room?.streamingOptions?.id && room.streamingOptions.type === 'livestream';

	return useMemo(
		() =>
			enabled
				? {
						groups: ['channel', 'group', 'team'],
						id: 'livestream',
						title: 'Livestream',
						icon: 'podcast',
						template: 'liveStreamTab',
						order: isLive ? -1 : 15,
						...(federated && {
							'data-tooltip': federated ? 'Livestream_unavailable_for_federation' : '',
							'disabled': true,
						}),
						renderAction: (props): ReactNode => (
							<Header.ToolBoxAction {...props}>
								{isLive ? (
									<Header.Badge title={t('Livestream_live_now')} variant='danger'>
										!
									</Header.Badge>
								) : null}
							</Header.ToolBoxAction>
						),
						renderOption: ({ label: { title, icon }, ...props }: any): ReactNode => (
							<Option label={title} title={title} icon={icon} {...props}>
								{isLive ? (
									<Badge title={t('Livestream_live_now')} variant='danger'>
										!
									</Badge>
								) : null}
							</Option>
						),
				  }
				: null,
		[enabled, isLive, t, federated],
	);
});
