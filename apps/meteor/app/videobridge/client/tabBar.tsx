import React, { useMemo } from 'react';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useSetModal, useUser } from '@rocket.chat/ui-contexts';

import { VideoConfManager } from '../../../client/lib/VideoConfManager';
import { addAction, ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';
import StartVideoConfModal from '../../../client/views/room/contextualBar/VideoConference/StartVideoConfModal';
import { useDispatchOutgoing, useDismissOutgoing, useStartCall } from '../../../client/contexts/VideoConfContext';

// TODO: fix mocked config
addAction('video-conf', ({ room }) => {
	const setModal = useSetModal();
	const startCall = useStartCall();
	const user = useUser();

	const dispatchPopup = useDispatchOutgoing();
	const dismissPopup = useDismissOutgoing();

	const handleCloseVideoConf = useMutableCallback(() => setModal());
	const enabled = useSetting('VideoConf_Enabled');
	const enabledDMs = useSetting('VideoConf_Enable_DMs');
	const enabledChannel = useSetting('VideoConf_Enable_Channels');
	const enabledTeams = useSetting('VideoConf_Enable_Teams');
	const enabledGroups = useSetting('VideoConf_Enable_Groups');
	const enabledLiveChat = useSetting('Omnichannel_call_provider') === 'Jitsi';

	const live = room?.streamingOptions && room.streamingOptions.type === 'call';

	const enableOption = enabled && (!user?.username || !room.muted?.includes(user.username));

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
		() =>
			enableOption
				? {
						groups,
						id: 'video-conference',
						title: 'Video Conference',
						icon: 'phone',
						action: handleOpenVideoConf,
						full: true,
						// TODO: issue with tests
						// order: live ? -1 : 4,
						order: live ? 99 : 99,
				  }
				: null,
		[handleOpenVideoConf, groups, enableOption, live],
	);
});
