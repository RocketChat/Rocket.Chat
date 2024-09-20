import { GenericMenu } from '@rocket.chat/ui-client';
import React, { useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../../views/room/contexts/RoomToolboxContext';
import useVideoConfMenuOptions from './useVideoConfMenuOptions';
import useVoipMenuOptions from './useVoipMenuOptions';

export const useStartCallRoomAction = () => {
	const voipCall = useVideoConfMenuOptions();
	const videoCall = useVoipMenuOptions();

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!videoCall.allowed && !voipCall.allowed) {
			return undefined;
		}

		return {
			id: 'start-call',
			title: 'Call',
			icon: 'phone',
			groups: [...videoCall.groups, ...voipCall.groups],
			disabled: videoCall.disabled && voipCall.disabled,
			full: true,
			order: Math.max(voipCall.order, videoCall.order),
			featured: true,
			renderToolboxItem: ({ id, icon, title, disabled }) => (
				<GenericMenu
					key={id}
					title={title}
					disabled={disabled}
					items={[...voipCall.items, ...videoCall.items]}
					placement='bottom-start'
					icon={icon}
				/>
			),
		};
	}, [videoCall, voipCall]);
};
