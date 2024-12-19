import { GenericMenu } from '@rocket.chat/ui-client';
import React, { useMemo } from 'react';

import useVideoConfMenuOptions from './useVideoConfMenuOptions';
import useVoipMenuOptions from './useVoipMenuOptions';
import HeaderToolbarAction from '../../../components/Header/HeaderToolbarAction';
import type { RoomToolboxActionConfig } from '../../../views/room/contexts/RoomToolboxContext';

export const useStartCallRoomAction = () => {
	const videoCall = useVideoConfMenuOptions();
	const voipCall = useVoipMenuOptions();

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
			renderToolboxItem: ({ id, icon, title, disabled, className }) => (
				<GenericMenu
					button={<HeaderToolbarAction />}
					key={id}
					title={title}
					disabled={disabled}
					items={[...voipCall.items, ...videoCall.items]}
					className={className}
					placement='bottom-start'
					icon={icon}
				/>
			),
		};
	}, [videoCall, voipCall]);
};
