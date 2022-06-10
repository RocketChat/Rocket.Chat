import React, { useMemo } from 'react';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useSetModal } from '@rocket.chat/ui-contexts';

import { VideoConfManager } from '../../../client/lib/VideoConfManager';
import { addAction, ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';
import StartVideoConfModal from '../../../client/views/room/contextualBar/VideoConference/StartVideoConfModal';
import { useVideoConfPopupDispatch, useStartCall, useVideoConfPopupDismiss } from '../../../client/contexts/VideoConfPopupContext';

// TODO: fix mocked config
addAction('video-conf', ({ room }) => {
	const setModal = useSetModal();
	const startCall = useStartCall();

	const dispatchPopup = useVideoConfPopupDispatch();
	const dismissPopup = useVideoConfPopupDismiss();

	const handleCloseVideoConf = useMutableCallback(() => setModal());

	const enabledDMs = useSetting('VideoConf_Enable_DMs');
	const enabledChannel = useSetting('VideoConf_Enable_Channels');
	const enabledTeams = useSetting('VideoConf_Enable_Teams');
	const enabledGroups = useSetting('VideoConf_Enable_Groups');
	const enabledLiveChat = useSetting('Omnichannel_call_provider') === 'Jitsi';

	const live = room?.streamingOptions && room.streamingOptions.type === 'call';

	const groups = useStableArray(
		[
			enabledDMs && 'direct',
			enabledDMs && 'direct_multiple',
			enabledGroups && 'group',
			enabledLiveChat && 'live',
			enabledTeams && 'team',
			enabledChannel && 'channel',
		].filter(Boolean) as ToolboxActionConfig['groups'],
	);

	const handleStartConference = useMutableCallback((confTitle) => {
		startCall(room._id, confTitle);
		handleCloseVideoConf();

		if (room.t === 'd') {
			dispatchPopup({ rid: room._id });
			// TODO: remove VideoConfManager
			VideoConfManager.once('direct/stopped', () => {
				dismissPopup();
			});
		}
	});

	const handleOpenVideoConf = useMutableCallback((): void =>
		setModal(<StartVideoConfModal onConfirm={handleStartConference} room={room} onClose={handleCloseVideoConf} />),
	);

	return useMemo(
		() => ({
			groups,
			id: 'video-conference',
			title: 'Video Conference',
			icon: 'phone',
			action: handleOpenVideoConf,
			full: true,
			order: live ? -1 : 4,
		}),
		[handleOpenVideoConf, groups, live],
	);
});
