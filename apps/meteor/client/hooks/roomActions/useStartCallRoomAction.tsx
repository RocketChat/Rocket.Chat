import React, { useMemo } from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import useVideoConfMenuOptions from './useVideoConfMenuOptions';
import useVoiceCallMenuOptions from './useVoiceCallMenuOptions';

export const useStartCallRoomAction = () => {
	const voiceCall = useVideoConfMenuOptions();
	const videoCall = useVoiceCallMenuOptions();

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!videoCall.allowed && !voiceCall.allowed) {
			return undefined;
		}

		return {
			id: 'start-call',
			title: 'Call',
			icon: 'phone',
			groups: [...videoCall.groups, ...voiceCall.groups],
			disabled: videoCall.disabled && voiceCall.disabled,
			full: true,
			order: Math.max(voiceCall.order, videoCall.order),
			featured: true,
			renderToolboxItem: ({ id, icon, title, disabled }) => (
				<GenericMenu
					key={id}
					title={title}
					disabled={disabled}
					items={[...voiceCall.items, ...videoCall.items]}
					placement='bottom-start'
					icon={icon}
				/>
			),
		};
	}, [videoCall, voiceCall]);
};
